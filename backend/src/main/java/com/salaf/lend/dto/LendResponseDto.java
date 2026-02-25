package com.salaf.lend.dto;

import lombok.Data;

@Data
public class LendResponseDto {
    // TODO: Add fields:
    //   Long id
    //   String borrowerName
    //   BigDecimal amount
    //   BigDecimal remainingBalance
    //   LocalDate dueDate
    //   String note
    //   String status
    //   double progressPercent   -> (amount - remaining) / amount * 100  (FR-21)
    //   LocalDateTime createdAt
    //   List<RepaymentResponse> repayments  -> repayment timeline (FR-20)

    // TODO: Add static factory: public static LendResponseDto fromEntity(LendRequest l) { ... }
}
