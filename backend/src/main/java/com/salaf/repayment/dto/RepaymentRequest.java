package com.salaf.repayment.dto;

import lombok.Data;

// TODO: Add the following fields to this DTO:
// - amountPaid (BigDecimal, required)
//   The amount being paid in this repayment installment
//
// - note (String, optional)
//   Free-text note from the borrower (e.g. "half payment", "final payment")
//
// TODO: Add validation annotations:
// - @NotNull and @DecimalMin("0.01") on amountPaid
// - @Size(max = 255) on note (optional)
//
// HINT: Use jakarta.validation.constraints.* for annotations

@Data
public class RepaymentRequest {
    // TODO: add fields here
}
