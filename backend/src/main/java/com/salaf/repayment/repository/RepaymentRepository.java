package com.salaf.repayment.repository;

import com.salaf.repayment.entity.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;

// TODO: Add the following query methods:
// - findByLendRequestId(Long lendRequestId) -> List<Repayment>
//   Used to get all repayments for a specific lend request
//
// - findByLendRequestIdOrderByPaidAtDesc(Long lendRequestId) -> List<Repayment>
//   Used to get repayment history sorted by most recent first
//
// HINT: Spring Data JPA will auto-generate these from method names -- no SQL needed

public interface RepaymentRepository extends JpaRepository<Repayment, Long> {
    // TODO: add query methods here
}
