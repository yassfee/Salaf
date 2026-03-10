package com.salaf.notification.dto;

import com.salaf.notification.entity.Notification;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long lendId,
        String senderName,
        String borrowerName,
        BigDecimal amount,
        BigDecimal amountPaid,
        BigDecimal remainingBalance,
        String note,
        String type,
        boolean read,
        LocalDateTime createdAt
) {
    private static String resolveType(Notification n) {
        if (n.getType() != null) return n.getType().name();
        String note = n.getNote() != null ? n.getNote().toLowerCase() : "";
        if (note.contains("lend request")) return "LEND_REQUEST";
        if (note.contains("borrow request")) return "BORROW_REQUEST";
        return "REMINDER";
    }

    public static NotificationResponse from(Notification n) {
        BigDecimal total = n.getLendRequest().getAmount();
        BigDecimal remaining = n.getLendRequest().getRemainingBalance();
        BigDecimal paid = total.subtract(remaining);
        return new NotificationResponse(
                n.getId(),
                n.getLendRequest().getId(),
                n.getSender().getName(),
                n.getLendRequest().getBorrower().getName(),
                total,
                paid,
                remaining,
                n.getNote(),
                resolveType(n),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
