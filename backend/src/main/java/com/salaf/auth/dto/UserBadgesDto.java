package com.salaf.auth.dto;

public record UserBadgesDto(
        boolean onTimeHero,
        boolean trustedLender,
        boolean debtFree,
        int completedLends,
        int overdueCount,
        String outstandingBorrowed
) {}
