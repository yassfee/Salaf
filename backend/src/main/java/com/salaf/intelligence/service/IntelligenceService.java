package com.salaf.intelligence.service;

import com.salaf.auth.entity.User;
import com.salaf.intelligence.dto.IntelligenceSummaryResponse;
import com.salaf.intelligence.dto.RiskyLendResponse;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.repayment.entity.Repayment;
import com.salaf.repayment.repository.RepaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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

        // Calculate total lent
        BigDecimal totalLent = allLends.stream()
                .filter(l -> l.getStatus() != LendStatus.REJECTED && l.getStatus() != LendStatus.PENDING)
                .map(LendRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total repaid
        BigDecimal totalRepaid = allLends.stream()
                .map(l -> l.getAmount().subtract(l.getRemainingBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total outstanding
        BigDecimal totalOutstanding = totalLent.subtract(totalRepaid);

        // Count overdue lends
        LocalDate today = LocalDate.now();
        int overdueCount = (int) allLends.stream()
                .filter(l -> (l.getStatus() == LendStatus.ACTIVE || l.getStatus() == LendStatus.PARTIALLY_PAID) 
                        && l.getDueDate().isBefore(today))
                .count();

        // Find top borrower
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

        return new IntelligenceSummaryResponse(
                totalLent,
                totalRepaid,
                totalOutstanding,
                overdueCount,
                topBorrower
        );
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
}
