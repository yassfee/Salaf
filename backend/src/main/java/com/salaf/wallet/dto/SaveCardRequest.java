package com.salaf.wallet.dto;

public record SaveCardRequest(
        String last4,
        String brand,
        String cardholderName,
        Integer expiryMonth,
        Integer expiryYear
) {}
