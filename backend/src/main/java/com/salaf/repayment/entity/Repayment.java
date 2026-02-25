package com.salaf.repayment.entity;

import com.salaf.lend.entity.LendRequest;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// TODO: Add the following fields to this entity:
// - id (Long, @Id, @GeneratedValue)
// - lendRequest (@ManyToOne ? LendRequest, nullable = false)
// - amountPaid (BigDecimal, nullable = false)
// - paidAt (LocalDateTime, auto-set on @PrePersist)
// - note (String, optional free-text note from borrower)
//
// TODO: Add @PrePersist to auto-set paidAt = LocalDateTime.now()
//
// RELATIONSHIP: Each Repayment belongs to one LendRequest
// A LendRequest can have many Repayments (partial payments allowed)
// After each repayment, recalculate remaining balance in RepaymentService

@Entity
@Table(name = "repayments")
@Data
public class Repayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // TODO: implement remaining fields here
}
