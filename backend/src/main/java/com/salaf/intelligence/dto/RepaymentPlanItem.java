package com.salaf.intelligence.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RepaymentPlanItem(
        int rank,
        Long lendId,
        String lenderName,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal remainingBalance,
        LocalDate dueDate,
        String status,
        BigDecimal suggestedPayment,
        String priority,   // OVERDUE | DUE_SOON | UPCOMING
        String reason,
        long daysUntilDue  // negative means overdue
) {}
