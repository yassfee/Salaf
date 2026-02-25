package com.salaf.intelligence.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// TODO: Inject IntelligenceService (constructor injection with @RequiredArgsConstructor)
//
// TODO: Implement the following endpoints under /api/intelligence:
//
// GET /api/intelligence/summary
//   - Returns a smart summary for the current user:
//     * totalLent (BigDecimal) - total money lent across all active lends
//     * totalRepaid (BigDecimal) - total money received back
//     * totalOutstanding (BigDecimal) - totalLent minus totalRepaid
//     * overdueCount (int) - how many lends are past their due date and unpaid
//     * topBorrower (String) - contact name who owes the most
//   - Add @AuthenticationPrincipal User currentUser as a method param
//
// GET /api/intelligence/risk
//   - Returns a list of risky lends:
//     * Lends where due date has passed and status is still ACTIVE
//     * Include borrower name, amount, due date, and days overdue
//
// GET /api/intelligence/trends
//   - (Optional / FR-26) Returns monthly lending trends
//   - How much was lent per month over the last 6 months
//   - Useful for a chart on the app's analytics screen
//
// NOTE: All endpoints require authentication -- use @AuthenticationPrincipal

@RestController
@RequestMapping("/api/intelligence")
public class IntelligenceController {
    // TODO: implement endpoints here
}
