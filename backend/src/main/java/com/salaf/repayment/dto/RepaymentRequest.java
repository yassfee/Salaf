package com.salaf.repayment.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RepaymentRequest {
    @NotNull(message = "Amount paid is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amountPaid;

    @Size(max = 255, message = "Note cannot exceed 255 characters")
    private String note;
}
