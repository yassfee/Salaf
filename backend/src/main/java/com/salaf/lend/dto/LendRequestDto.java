package com.salaf.lend.dto;

import lombok.Data;

@Data
public class LendRequestDto {
    // TODO: Add fields:
    //   Long contactId     -- @NotNull, the borrower contact
    //   BigDecimal amount  -- @NotNull @Positive
    //   LocalDate dueDate  -- @NotNull @Future
    //   String note        -- optional
}
