package com.salaf.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DashboardResponse {
    private BigDecimal totalLent;
    private BigDecimal totalBorrowed;
    private BigDecimal outstanding;
    private BigDecimal overdue;
    private int activeCount;
    private int overdueCount;
}
