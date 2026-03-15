package com.salaf.wallet.dto;

import jakarta.validation.constraints.*;

public record SaveCardRequest(
        @NotBlank @Pattern(regexp = "\\d{4}", message = "Last 4 digits must be exactly 4 numbers")
        String last4,
        
        @NotBlank @Pattern(regexp = "^(VISA|MASTERCARD|AMEX|DISCOVER|MADA|OTHER)$", message = "Invalid card brand")
        String brand,
        
        @Size(max = 100, message = "Cardholder name too long")
        String cardholderName,
        
        @NotNull @Min(value = 1, message = "Invalid month") @Max(value = 12, message = "Invalid month")
        Integer expiryMonth,
        
        @NotNull @Min(value = 2024, message = "Card expired")
        Integer expiryYear
) {}
