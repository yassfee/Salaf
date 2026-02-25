package com.salaf.repayment.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// TODO: Inject RepaymentService (constructor injection with @RequiredArgsConstructor)
//
// TODO: Implement the following endpoints under /api/lends:
//
// POST /api/lends/{lendId}/repayments
//   - Accept RepaymentRequest body
//   - Call repaymentService.recordRepayment(lendId, request, currentUser)
//   - Returns: ResponseEntity with updated repayment summary
//   - Add @AuthenticationPrincipal User currentUser as a method param
//
// GET /api/lends/{lendId}/repayments
//   - Returns list of all repayment records for a lend (history)
//   - Sorted by most recent first
//   - Add @AuthenticationPrincipal User currentUser to verify ownership
//
// GET /api/lends/{lendId}/repayments/summary
//   - Returns total paid, total remaining, and count of payments
//   - Useful for the lend detail screen
//
// NOTE: All endpoints should be protected -- only the lend owner can view/add repayments

@RestController
@RequestMapping("/api/lends")
public class RepaymentController {
    // TODO: implement endpoints here
}
