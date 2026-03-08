package com.salaf.lend.dto;

import com.salaf.lend.entity.LendRequest;
import com.salaf.repayment.dto.RepaymentResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LendResponseDto {

    private Long id;
    private String contact;           // borrower name (lender view) or lender name (borrower view)
    private Long contactId;           // borrower contact ID
    private String lenderName;        // always the lender's name
    private String lenderEmail;       // always the lender's email
    private BigDecimal amount;
    private BigDecimal paid;          // amount - remainingBalance — matches frontend Lend.paid
    private BigDecimal remainingBalance;
    private LocalDate due;            // matches frontend Lend.due
    private String note;
    private String status;
    private String type;              // "LENT" or "BORROWED"
    private double progressPercent;
    private LocalDateTime createdAt;
    private List<RepaymentResponse> repayments;

    private static double calcProgress(LendRequest l) {
        if (l.getAmount().compareTo(BigDecimal.ZERO) == 0) return 0.0;
        BigDecimal paid = l.getAmount().subtract(l.getRemainingBalance());
        return paid.divide(l.getAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    /** Lender's perspective — contact = borrower name, type = LENT */
    public static LendResponseDto from(LendRequest l) {
        BigDecimal paid = l.getAmount().subtract(l.getRemainingBalance());
        return LendResponseDto.builder()
                .id(l.getId())
                .contact(l.getBorrower().getName())
                .contactId(l.getBorrower().getId())
                .lenderName(l.getLender().getName())
                .lenderEmail(l.getLender().getEmail())
                .amount(l.getAmount())
                .paid(paid)
                .remainingBalance(l.getRemainingBalance())
                .due(l.getDueDate())
                .note(l.getNote())
                .status(l.getStatus().name())
                .type("LENT")
                .progressPercent(calcProgress(l))
                .createdAt(l.getCreatedAt())
                .repayments(Collections.emptyList())
                .build();
    }

    /** Borrower's perspective — contact = lender name, type = BORROWED */
    public static LendResponseDto fromBorrowerView(LendRequest l) {
        BigDecimal paid = l.getAmount().subtract(l.getRemainingBalance());
        return LendResponseDto.builder()
                .id(l.getId())
                .contact(l.getLender().getName())
                .contactId(l.getBorrower().getId())
                .lenderName(l.getLender().getName())
                .lenderEmail(l.getLender().getEmail())
                .amount(l.getAmount())
                .paid(paid)
                .remainingBalance(l.getRemainingBalance())
                .due(l.getDueDate())
                .note(l.getNote())
                .status(l.getStatus().name())
                .type("BORROWED")
                .progressPercent(calcProgress(l))
                .createdAt(l.getCreatedAt())
                .repayments(Collections.emptyList())
                .build();
    }

    public static LendResponseDto from(LendRequest l, List<RepaymentResponse> repayments) {
        LendResponseDto dto = from(l);
        dto.setRepayments(repayments);
        return dto;
    }
}
