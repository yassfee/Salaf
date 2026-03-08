package com.salaf.lend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class BorrowRequestDto {

    /** ID of the borrower's contact that represents the desired lender. */
    @NotNull
    private Long lenderContactId;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    @Future
    private LocalDate dueDate;

    private String note;
}
