package com.salaf.intelligence.service;

import com.salaf.auth.entity.User;
import com.salaf.intelligence.dto.IntelligenceSummaryResponse;
import com.salaf.intelligence.dto.RepaymentPlanItem;
import com.salaf.intelligence.dto.RiskyLendResponse;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.repayment.repository.RepaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class IntelligenceService {
    private final LendRequestRepository lendRequestRepository;
    private final RepaymentRepository repaymentRepository;

    public IntelligenceService(LendRequestRepository lendRequestRepository,
                               RepaymentRepository repaymentRepository) {
        this.lendRequestRepository = lendRequestRepository;
        this.repaymentRepository = repaymentRepository;
    }

    public IntelligenceSummaryResponse getSummary(User currentUser) {
        List<LendRequest> allLends = lendRequestRepository.findByLender(currentUser);

        BigDecimal totalLent = allLends.stream()
                .filter(l -> l.getStatus() != LendStatus.REJECTED && l.getStatus() != LendStatus.PENDING)
                .map(LendRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRepaid = allLends.stream()
                .map(l -> l.getAmount().subtract(l.getRemainingBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstanding = totalLent.subtract(totalRepaid);

        LocalDate today = LocalDate.now();
        int overdueCount = (int) allLends.stream()
                .filter(l -> (l.getStatus() == LendStatus.ACTIVE || l.getStatus() == LendStatus.PARTIALLY_PAID)
                        && l.getDueDate().isBefore(today))
                .count();

        Map<String, BigDecimal> borrowerBalances = allLends.stream()
                .filter(l -> l.getRemainingBalance().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.groupingBy(
                        l -> l.getBorrower().getName(),
                        Collectors.mapping(LendRequest::getRemainingBalance,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        String topBorrower = borrowerBalances.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        return new IntelligenceSummaryResponse(totalLent, totalRepaid, totalOutstanding, overdueCount, topBorrower);
    }

    public List<RiskyLendResponse> getRiskyLends(User currentUser) {
        LocalDate today = LocalDate.now();
        return lendRequestRepository.findByLenderAndStatusAndDueDateBefore(
                currentUser, LendStatus.ACTIVE, today)
                .stream()
                .map(lend -> {
                    long daysOverdue = ChronoUnit.DAYS.between(lend.getDueDate(), today);
                    return new RiskyLendResponse(
                            lend.getId(),
                            lend.getBorrower().getName(),
                            lend.getAmount(),
                            lend.getRemainingBalance(),
                            lend.getDueDate(),
                            daysOverdue
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Generate a prioritised repayment plan for the current user (as borrower).
     *
     * strategy: "urgency"   → overdue first, then earliest due date (default)
     *           "snowball"  → smallest remaining balance first (quick wins)
     *           "avalanche" → largest remaining balance first (minimise total)
     *
     * budget: total amount the borrower can pay today (0 = no budget, show priority order only)
     */
    public List<RepaymentPlanItem> getRepaymentPlan(User currentUser, BigDecimal budget, String strategy) {
        LocalDate today = LocalDate.now();
        List<LendStatus> activeStatuses = List.of(
                LendStatus.ACCEPTED, LendStatus.ACTIVE, LendStatus.PARTIALLY_PAID, LendStatus.OVERDUE);

        List<LendRequest> borrowed = lendRequestRepository
                .findByBorrower_LinkedUserAndStatusIn(currentUser, activeStatuses);

        // Sort according to strategy
        Comparator<LendRequest> comparator = switch (strategy == null ? "urgency" : strategy) {
            case "snowball" -> Comparator.comparing(LendRequest::getRemainingBalance);
            case "avalanche" -> Comparator.comparing(LendRequest::getRemainingBalance).reversed();
            default -> (a, b) -> {
                // urgency: overdue first, then earliest due date
                boolean aOverdue = a.getDueDate().isBefore(today);
                boolean bOverdue = b.getDueDate().isBefore(today);
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                return a.getDueDate().compareTo(b.getDueDate());
            };
        };

        List<LendRequest> sorted = borrowed.stream().sorted(comparator).collect(Collectors.toList());

        List<RepaymentPlanItem> plan = new ArrayList<>();
        BigDecimal remaining = budget != null ? budget : BigDecimal.ZERO;
        boolean hasBudget = budget != null && budget.compareTo(BigDecimal.ZERO) > 0;
        int rank = 1;

        for (LendRequest lend : sorted) {
            long daysUntilDue = ChronoUnit.DAYS.between(today, lend.getDueDate());
            BigDecimal amountPaid = lend.getAmount().subtract(lend.getRemainingBalance());

            String priority;
            String reason;
            if (daysUntilDue < 0) {
                priority = "OVERDUE";
                reason = "Overdue by " + Math.abs(daysUntilDue) + " day(s) — pay immediately";
            } else if (daysUntilDue <= 7) {
                priority = "DUE_SOON";
                reason = "Due in " + daysUntilDue + " day(s) — urgent";
            } else if (daysUntilDue <= 30) {
                priority = "UPCOMING";
                reason = "Due in " + daysUntilDue + " day(s)";
            } else {
                priority = "LATER";
                reason = "Due on " + lend.getDueDate();
            }

            BigDecimal suggested;
            if (hasBudget) {
                suggested = remaining.min(lend.getRemainingBalance());
                remaining = remaining.subtract(suggested);
            } else {
                suggested = lend.getRemainingBalance(); // suggest full balance when no budget
            }

            plan.add(new RepaymentPlanItem(
                    rank++,
                    lend.getId(),
                    lend.getLender().getName(),
                    lend.getAmount(),
                    amountPaid,
                    lend.getRemainingBalance(),
                    lend.getDueDate(),
                    lend.getStatus().name(),
                    suggested,
                    priority,
                    reason,
                    daysUntilDue
            ));

            if (hasBudget && remaining.compareTo(BigDecimal.ZERO) <= 0) break;
        }

        return plan;
    }
}
