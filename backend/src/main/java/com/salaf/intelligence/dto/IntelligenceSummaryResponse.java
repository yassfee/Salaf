package com.salaf.intelligence.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IntelligenceSummaryResponse {
    private BigDecimal totalLent;
    private BigDecimal totalRepaid;
    private BigDecimal totalOutstanding;
    private int overdueCount;
    private String topBorrower;
}
