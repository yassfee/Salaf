package com.salaf.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class LendSummaryDto {
    private Long id;
    private String contact;         // borrower name (LENT) or lender name (BORROWED)
    private Long contactId;
    private BigDecimal amount;
    private BigDecimal paid;        // amount - remainingBalance
    private BigDecimal remainingBalance;
    private LocalDate due;          // renamed from dueDate to match frontend
    private String status;
    private String type;            // "LENT" or "BORROWED"
}
