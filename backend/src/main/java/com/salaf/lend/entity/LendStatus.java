package com.salaf.lend.entity;

public enum LendStatus {
    PENDING,
    BORROW_REQUESTED,   // borrower initiated the request; lender must approve
    ACCEPTED,
    REJECTED,
    ACTIVE,
    PARTIALLY_PAID,
    PAID,
    OVERDUE
}
