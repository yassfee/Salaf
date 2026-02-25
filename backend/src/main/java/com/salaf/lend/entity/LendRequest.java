package com.salaf.lend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "lend_requests")
@Data
public class LendRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // TODO: add remaining fields below

    // TODO: Add fields:
    //   Long id                  -> @Id @GeneratedValue
    //   User lender              -> @ManyToOne @JoinColumn(name = "lender_id")
    //   Contact borrower         -> @ManyToOne @JoinColumn(name = "borrower_id")
    //   BigDecimal amount        -> @Column(nullable = false)
    //   BigDecimal remainingBalance -> tracks how much is still owed
    //   LocalDate dueDate        -> @Column(nullable = false)
    //   String note              -> optional
    //   LendStatus status        -> @Enumerated(EnumType.STRING), default = PENDING
    //   LocalDateTime createdAt  -> @Column(updatable = false), set via @PrePersist

    // TODO: Create LendStatus enum in the same package with values:
    //   PENDING, ACCEPTED, REJECTED, ACTIVE, PARTIALLY_PAID, PAID, OVERDUE
}
