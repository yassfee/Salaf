package com.salaf.lend.entity;

import com.salaf.auth.entity.User;
import com.salaf.contact.entity.Contact;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lend_requests")
@Data
public class LendRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lender_id", nullable = false)
    private User lender;

    @ManyToOne
    @JoinColumn(name = "borrower_id", nullable = false)
    private Contact borrower;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private BigDecimal remainingBalance;

    @Column(nullable = false)
    private LocalDate dueDate;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LendStatus status = LendStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (remainingBalance == null) remainingBalance = amount;
    }
}
