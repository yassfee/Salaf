package com.salaf.repayment.repository;

import com.salaf.auth.entity.User;
import com.salaf.repayment.entity.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RepaymentRepository extends JpaRepository<Repayment, Long> {
    List<Repayment> findByLendRequestId(Long lendRequestId);
    List<Repayment> findByLendRequestIdOrderByPaidAtDesc(Long lendRequestId);

    @Query("SELECT r FROM Repayment r JOIN FETCH r.lendRequest lr JOIN FETCH lr.lender JOIN FETCH lr.borrower b LEFT JOIN FETCH b.linkedUser WHERE b.linkedUser = :user ORDER BY r.paidAt DESC")
    List<Repayment> findByBorrowerLinkedUser(@Param("user") User user);
}
