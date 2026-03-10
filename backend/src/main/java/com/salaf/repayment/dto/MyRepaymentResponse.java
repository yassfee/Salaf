package com.salaf.repayment.dto;

import com.salaf.repayment.entity.Repayment;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MyRepaymentResponse(
        Long id,
        Long lendId,
        String lenderName,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        String note,
        LocalDateTime paidAt
) {
    public static MyRepaymentResponse from(Repayment r) {
        return new MyRepaymentResponse(
                r.getId(),
                r.getLendRequest().getId(),
                r.getLendRequest().getLender().getName(),
                r.getLendRequest().getAmount(),
                r.getAmountPaid(),
                r.getNote(),
                r.getPaidAt()
        );
    }
}
