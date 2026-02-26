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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final LendRequestRepository lendRequestRepository;

    // Task 6 — FR-17: aggregate totals for the authenticated user
    public DashboardResponse getSummary(User user) {
        List<LendRequest> lends = lendRequestRepository.findByLender(user);

        BigDecimal totalLent = lends.stream()
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

        return new DashboardResponse(
                totalLent,
                BigDecimal.ZERO, // borrowed tracking handled by Person 2
                outstanding,
                overdue,
                activeCount,
                overdueCount
        );
    }

    // Task 7 — FR-18: lends that are overdue or due within the next 7 days
    public List<LendSummaryDto> getDueSoon(User user) {
        List<LendStatus> activeStatuses = List.of(
                LendStatus.ACTIVE, LendStatus.PARTIALLY_PAID, LendStatus.OVERDUE);
        LocalDate cutoff = LocalDate.now().plusDays(7);

        return lendRequestRepository.findByLenderAndStatusIn(user, activeStatuses).stream()
                .filter(l -> l.getStatus() == LendStatus.OVERDUE || !l.getDueDate().isAfter(cutoff))
                .sorted((a, b) -> a.getDueDate().compareTo(b.getDueDate()))
                .map(l -> new LendSummaryDto(
                        l.getId(),
                        l.getBorrower().getName(),
                        l.getAmount(),
                        l.getRemainingBalance(),
                        l.getDueDate(),
                        l.getStatus().name()
                ))
                .collect(Collectors.toList());
    }
}
