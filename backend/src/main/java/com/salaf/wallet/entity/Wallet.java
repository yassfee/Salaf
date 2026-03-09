package com.salaf.wallet.entity;

import com.salaf.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
@Data
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal balance = BigDecimal.ZERO;

    private String last4;
    private String brand;
    private String cardholderName;
    private Integer expiryMonth;
    private Integer expiryYear;
}
