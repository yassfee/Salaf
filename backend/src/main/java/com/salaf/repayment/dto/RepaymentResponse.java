package com.salaf.repayment.dto;

import com.salaf.repayment.entity.Repayment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepaymentResponse {

    private Long id;
    private BigDecimal amountPaid;
    private LocalDateTime paidAt;
    private String note;

    public static RepaymentResponse from(Repayment repayment) {
        return RepaymentResponse.builder()
                .id(repayment.getId())
                .amountPaid(repayment.getAmountPaid())
                .paidAt(repayment.getPaidAt())
                .note(repayment.getNote())
                .build();
    }
}
