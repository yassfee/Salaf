package com.salaf.repayment.repository;

import com.salaf.repayment.entity.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepaymentRepository extends JpaRepository<Repayment, Long> {
    List<Repayment> findByLendRequestId(Long lendRequestId);
    List<Repayment> findByLendRequestIdOrderByPaidAtDesc(Long lendRequestId);
    List<Repayment> findByLendRequest_Borrower_LinkedUserOrderByPaidAtDesc(com.salaf.auth.entity.User user);
}
