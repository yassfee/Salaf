package com.salaf.common;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.regex.Pattern;

@Component
public class SecurityValidator {

    private static final Pattern STRONG_PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    );
    
    private static final BigDecimal MAX_TRANSACTION_AMOUNT = new BigDecimal("10000.00");
    private static final BigDecimal MIN_TRANSACTION_AMOUNT = new BigDecimal("0.01");

    public boolean isStrongPassword(String password) {
        if (password == null) return false;
        return STRONG_PASSWORD_PATTERN.matcher(password).matches();
    }

    public void validateTransactionAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        
        if (amount.compareTo(MIN_TRANSACTION_AMOUNT) < 0) {
            throw new IllegalArgumentException("Amount too small. Minimum is " + MIN_TRANSACTION_AMOUNT);
        }
        
        if (amount.compareTo(MAX_TRANSACTION_AMOUNT) > 0) {
            throw new IllegalArgumentException("Amount too large. Maximum is " + MAX_TRANSACTION_AMOUNT);
        }
    }

    public void validateDueDate(LocalDate dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date cannot be null");
        }
        
        if (dueDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Due date cannot be in the past");
        }
        
        if (dueDate.isAfter(LocalDate.now().plusYears(5))) {
            throw new IllegalArgumentException("Due date cannot be more than 5 years in the future");
        }
    }

    public boolean isValidUserId(Long userId) {
        return userId != null && userId > 0;
    }

    public boolean isValidContactId(Long contactId) {
        return contactId != null && contactId > 0;
    }

    public String getPasswordStrengthMessage(String password) {
        if (password == null || password.length() < 8) {
            return "Password must be at least 8 characters long";
        }
        
        if (!password.matches(".*[a-z].*")) {
            return "Password must contain at least one lowercase letter";
        }
        
        if (!password.matches(".*[A-Z].*")) {
            return "Password must contain at least one uppercase letter";
        }
        
        if (!password.matches(".*\\d.*")) {
            return "Password must contain at least one digit";
        }
        
        if (!password.matches(".*[@$!%*?&].*")) {
            return "Password must contain at least one special character (@$!%*?&)";
        }
        
        return "Password is strong";
    }
}