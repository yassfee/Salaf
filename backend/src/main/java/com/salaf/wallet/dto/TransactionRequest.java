package com.salaf.wallet.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record TransactionRequest(
    @NotNull @Positive @DecimalMax(value = "99999.999", message = "Amount exceeds maximum allowed")
    BigDecimal amount,
    @NotNull @Pattern(regexp = "^(DEPOSIT|WITHDRAWAL)$", message = "Type must be DEPOSIT or WITHDRAWAL")
    String type
) {}