package com.salaf.repayment.service;

import org.springframework.stereotype.Service;

// TODO: Inject RepaymentRepository and LendRequestRepository (constructor injection)
//
// TODO: Implement the following methods:
//
// recordRepayment(Long lendId, RepaymentRequest request, User currentUser)
//   - Find the LendRequest by lendId, verify it belongs to currentUser (throw 403 if not)
//   - Validate that amountPaid > 0
//   - Calculate remaining balance: lend.amount - sum of all previous repayments
//   - Ensure amountPaid does not exceed remaining balance
//   - Save a new Repayment entity
//   - If remaining balance reaches 0, update LendRequest status to REPAID
//   - Return a response with updated balance info
//
// getRepaymentHistory(Long lendId, User currentUser)
//   - Verify lend belongs to currentUser
//   - Return all Repayment records for this lend, sorted by paidAt DESC
//
// getRepaymentSummary(Long lendId, User currentUser)
//   - Return: totalAmount, totalPaid (sum), totalRemaining, repaymentCount
//   - Useful for showing progress on lend detail screen
//
// NOTE: Use @Transactional on recordRepayment to ensure atomicity

@Service
public class RepaymentService {
    // TODO: implement methods here
}
