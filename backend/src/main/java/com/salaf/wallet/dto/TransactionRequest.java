package com.salaf.wallet.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record TransactionRequest(
    @NotNull @Positive BigDecimal amount,
    @NotNull String type, // "DEPOSIT", "WITHDRAWAL", "TRANSFER"
    String description,
    String verificationToken // For additional security
) {}