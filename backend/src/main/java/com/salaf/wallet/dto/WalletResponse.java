package com.salaf.wallet.dto;

import com.salaf.wallet.entity.Wallet;

import java.math.BigDecimal;

public record WalletResponse(
        BigDecimal balance,
        String last4,
        String brand,
        String cardholderName,
        Integer expiryMonth,
        Integer expiryYear,
        boolean hasCard
) {
    public static WalletResponse from(Wallet w) {
        return new WalletResponse(
                w.getBalance(),
                w.getLast4(),
                w.getBrand(),
                w.getCardholderName(),
                w.getExpiryMonth(),
                w.getExpiryYear(),
                w.getLast4() != null
        );
    }
}
