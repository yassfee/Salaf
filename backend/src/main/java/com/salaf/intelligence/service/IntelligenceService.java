package com.salaf.intelligence.service;

import org.springframework.stereotype.Service;

// TODO: Inject LendRequestRepository and RepaymentRepository (constructor injection)
//
// TODO: Implement the following methods:
//
// getSummary(User currentUser)
//   - Aggregate data across all lend requests belonging to currentUser
//   - totalLent: sum of all LendRequest.amount where lender = currentUser
//   - totalRepaid: sum of all Repayment.amountPaid for those lends
//   - totalOutstanding: totalLent - totalRepaid
//   - overdueCount: count of lends where dueDate < today AND status = ACTIVE
//   - topBorrower: the borrower contact with the highest outstanding balance
//   - Return as a DTO (create IntelligenceSummaryResponse DTO class)
//
// getRiskyLends(User currentUser)
//   - Find all lend requests where:
//     * lender = currentUser
//     * status = ACTIVE
//     * dueDate < LocalDate.now()
//   - For each, calculate daysOverdue = ChronoUnit.DAYS.between(dueDate, today)
//   - Return as a list of DTO objects with borrower info and overdue details
//
// getTrends(User currentUser) [Optional - FR-26]
//   - Group lend requests by month (last 6 months)
//   - Sum amounts per month
//   - Return as a list of { month: 2025-01, totalLent: BigDecimal }
//   - Useful for displaying a chart on the analytics/intelligence screen
//
// HINT: Use Java Streams for aggregation logic (no native SQL needed)

@Service
public class IntelligenceService {
    // TODO: implement methods here
}
