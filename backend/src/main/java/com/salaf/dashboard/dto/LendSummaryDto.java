package com.salaf.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class LendSummaryDto {
    private Long id;
    private String borrowerName;
    private BigDecimal amount;
    private BigDecimal remainingBalance;
    private LocalDate dueDate;
    private String status;
}
