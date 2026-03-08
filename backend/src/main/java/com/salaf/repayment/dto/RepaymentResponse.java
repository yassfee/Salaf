package com.salaf.repayment.dto;

import com.salaf.repayment.entity.Repayment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepaymentResponse {
    private Long id;
    private BigDecimal amountPaid;
    private LocalDateTime paidAt;
    private String note;

    public static RepaymentResponse fromEntity(Repayment repayment) {
        return new RepaymentResponse(
                repayment.getId(),
                repayment.getAmountPaid(),
                repayment.getPaidAt(),
                repayment.getNote()
        );
    }
}
