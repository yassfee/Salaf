package com.salaf.intelligence.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskyLendResponse {
    private Long lendId;
    private String borrowerName;
    private BigDecimal amount;
    private BigDecimal remainingBalance;
    private LocalDate dueDate;
    private long daysOverdue;
}
