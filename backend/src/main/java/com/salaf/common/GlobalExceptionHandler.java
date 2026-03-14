package com.salaf.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Autowired
    private AuditService auditService;

    /** Handles ResponseStatusException (e.g. insufficient balance from LendRequestService). */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "An error occurred";
        
        // Log the full exception for debugging, but return sanitized message
        logger.warn("ResponseStatusException: {}", ex.getMessage());
        
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", sanitizeErrorMessage(message)));
    }

    /** Handles IllegalArgumentException (e.g. repayment validation errors). */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("IllegalArgumentException: {}", ex.getMessage());
        
        // Check if this might be a security-related error
        if (ex.getMessage().contains("malicious") || ex.getMessage().contains("injection")) {
            auditService.logSecurityEvent("MALICIOUS_INPUT_BLOCKED", "unknown", ex.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid input format"));
        }
        
        return ResponseEntity.badRequest()
                .body(Map.of("message", sanitizeErrorMessage(ex.getMessage())));
    }

    /** Handles validation errors from @Valid annotations */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, sanitizeErrorMessage(errorMessage));
        });
        
        response.put("message", "Validation failed");
        response.put("errors", errors);
        
        logger.info("Validation error: {}", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /** Handles authentication errors */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        logger.warn("Authentication failed: {}", ex.getMessage());
        
        // Don't reveal whether user exists or password is wrong
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid credentials"));
    }

    /** Handles all other exceptions */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        logger.error("Unexpected error occurred", ex);
        
        // Log for debugging but don't expose internal details
        auditService.logSecurityEvent("UNEXPECTED_ERROR", "unknown", ex.getClass().getSimpleName());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An internal error occurred. Please try again later."));
    }

    private String sanitizeErrorMessage(String message) {
        if (message == null) return "An error occurred";
        
        // Remove potentially sensitive information
        return message
                .replaceAll("(?i)\\b(password|token|secret|key)\\b", "***")
                .replaceAll("\\b\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\b", "****-****-****-****") // Credit card numbers
                .replaceAll("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "***@***.***") // Email addresses
                .trim();
    }
}
