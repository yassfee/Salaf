package com.salaf.repayment.entity;

import com.salaf.lend.entity.LendRequest;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "repayments")
@Data
public class Repayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lend_request_id", nullable = false)
    private LendRequest lendRequest;

    @Column(nullable = false)
    private BigDecimal amountPaid;

    @Column(nullable = false, updatable = false)
    private LocalDateTime paidAt;

    private String note;

    @PrePersist
    protected void onCreate() {
        paidAt = LocalDateTime.now();
    }
}
