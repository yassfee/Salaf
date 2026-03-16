package com.salaf.dashboard.service;

import com.salaf.auth.entity.User;
import com.salaf.dashboard.dto.DashboardResponse;
import com.salaf.dashboard.dto.LendSummaryDto;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final LendRequestRepository lendRequestRepository;

    // Task 6 — FR-17: aggregate totals for the authenticated user
    public DashboardResponse getSummary(User user) {
        List<LendRequest> lends = lendRequestRepository.findByLender(user);
        List<LendRequest> borrows = lendRequestRepository.findByBorrower_LinkedUser(user);

        BigDecimal totalLent = lends.stream()
                .filter(l -> l.getStatus() != LendStatus.PENDING && l.getStatus() != LendStatus.REJECTED)
                .map(LendRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalBorrowed = borrows.stream()
                .filter(l -> l.getStatus() != LendStatus.PENDING && l.getStatus() != LendStatus.REJECTED)
                .map(LendRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstanding = lends.stream()
                .filter(l -> l.getStatus() == LendStatus.ACTIVE || l.getStatus() == LendStatus.PARTIALLY_PAID)
                .map(LendRequest::getRemainingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal overdue = lends.stream()
                .filter(l -> l.getStatus() == LendStatus.OVERDUE)
                .map(LendRequest::getRemainingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int activeCount = (int) lends.stream()
                .filter(l -> l.getStatus() == LendStatus.ACTIVE || l.getStatus() == LendStatus.PARTIALLY_PAID)
                .count();

        int overdueCount = (int) lends.stream()
                .filter(l -> l.getStatus() == LendStatus.OVERDUE)
                .count();

        // Add borrowed active count to total active count
        int borrowedActiveCount = (int) borrows.stream()
                .filter(l -> l.getStatus() == LendStatus.ACTIVE || l.getStatus() == LendStatus.PARTIALLY_PAID)
                .count();

        return new DashboardResponse(
                totalLent,
                totalBorrowed,
                outstanding,
                overdue,
                activeCount + borrowedActiveCount,
                overdueCount
        );
    }

    // Task 7 — FR-18: lends overdue or due within the next 7 days (both lender + borrower)
    public List<LendSummaryDto> getDueSoon(User user) {
        List<LendStatus> activeStatuses = List.of(
                LendStatus.ACTIVE, LendStatus.PARTIALLY_PAID, LendStatus.OVERDUE, LendStatus.ACCEPTED);
        LocalDate cutoff = LocalDate.now().plusDays(7);

        List<LendSummaryDto> result = new ArrayList<>();

        // Lends where user is the lender
        lendRequestRepository.findByLenderAndStatusIn(user, activeStatuses).stream()
                .filter(l -> l.getStatus() == LendStatus.OVERDUE || !l.getDueDate().isAfter(cutoff))
                .map(l -> new LendSummaryDto(
                        l.getId(),
                        l.getBorrower().getName(),
                        l.getBorrower().getId(),
                        l.getAmount(),
                        l.getAmount().subtract(l.getRemainingBalance()),
                        l.getRemainingBalance(),
                        l.getDueDate(),
                        l.getStatus().name(),
                        "LENT"
                ))
                .forEach(result::add);

        // Lends where user is the borrower
        lendRequestRepository.findByBorrower_LinkedUserAndStatusIn(user, activeStatuses).stream()
                .filter(l -> l.getStatus() == LendStatus.OVERDUE || !l.getDueDate().isAfter(cutoff))
                .map(l -> new LendSummaryDto(
                        l.getId(),
                        l.getLender().getName(),
                        l.getBorrower().getId(),
                        l.getAmount(),
                        l.getAmount().subtract(l.getRemainingBalance()),
                        l.getRemainingBalance(),
                        l.getDueDate(),
                        l.getStatus().name(),
                        "BORROWED"
                ))
                .forEach(result::add);

        result.sort(Comparator.comparing(LendSummaryDto::getDue));
        return result;
    }
}
