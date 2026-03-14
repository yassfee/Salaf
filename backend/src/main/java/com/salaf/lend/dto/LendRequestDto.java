package com.salaf.lend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LendRequestDto {

    @NotNull(message = "Contact ID is required")
    @Positive(message = "Contact ID must be positive")
    private Long contactId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
    @DecimalMax(value = "10000.00", message = "Amount cannot exceed 10,000.00")
    @Digits(integer = 8, fraction = 2, message = "Amount format invalid")
    private BigDecimal amount;

    @NotNull(message = "Due date is required")
    @Future(message = "Due date must be in the future")
    private LocalDate dueDate;

    @Size(max = 500, message = "Note cannot exceed 500 characters")
    private String note;
}
