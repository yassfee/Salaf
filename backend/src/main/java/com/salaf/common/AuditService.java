package com.salaf.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class AuditService {

    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT");

    public void logUserRegistration(String email) {
        auditLogger.info("USER_REGISTRATION - Email: {} - Time: {}", email, LocalDateTime.now());
    }

    public void logUserLogin(String email, boolean success) {
        if (success) {
            auditLogger.info("USER_LOGIN_SUCCESS - Email: {} - Time: {}", email, LocalDateTime.now());
        } else {
            auditLogger.warn("USER_LOGIN_FAILED - Email: {} - Time: {}", email, LocalDateTime.now());
        }
    }

    public void logPasswordChange(String email) {
        auditLogger.info("PASSWORD_CHANGE - Email: {} - Time: {}", email, LocalDateTime.now());
    }

    public void logAccountDeletion(String email) {
        auditLogger.warn("ACCOUNT_DELETION - Email: {} - Time: {}", email, LocalDateTime.now());
    }

    public void logLendCreation(String lenderEmail, BigDecimal amount, String borrowerEmail) {
        auditLogger.info("LEND_CREATED - Lender: {} - Borrower: {} - Amount: {} - Time: {}", 
            lenderEmail, borrowerEmail, amount, LocalDateTime.now());
    }

    public void logLendStatusChange(Long lendId, String oldStatus, String newStatus, String userEmail) {
        auditLogger.info("LEND_STATUS_CHANGE - LendId: {} - From: {} - To: {} - User: {} - Time: {}", 
            lendId, oldStatus, newStatus, userEmail, LocalDateTime.now());
    }

    public void logWalletTransaction(String userEmail, String type, BigDecimal amount) {
        auditLogger.info("WALLET_TRANSACTION - User: {} - Type: {} - Amount: {} - Time: {}", 
            userEmail, type, amount, LocalDateTime.now());
    }

    public void logRepayment(String borrowerEmail, Long lendId, BigDecimal amount) {
        auditLogger.info("REPAYMENT_RECORDED - Borrower: {} - LendId: {} - Amount: {} - Time: {}", 
            borrowerEmail, lendId, amount, LocalDateTime.now());
    }

    public void logSecurityEvent(String event, String userEmail, String details) {
        auditLogger.warn("SECURITY_EVENT - Event: {} - User: {} - Details: {} - Time: {}", 
            event, userEmail, details, LocalDateTime.now());
    }
}