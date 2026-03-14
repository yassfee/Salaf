package com.salaf.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

@Component
public class InputSanitizer {

    private static final Pattern HTML_PATTERN = Pattern.compile("<[^>]+>");
    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?i)<script[^>]*>.*?</script>");
    
    @Autowired
    private SQLInjectionValidator sqlInjectionValidator;

    public String sanitizeText(String input) {
        if (input == null) return null;
        
        // Check for SQL injection first
        if (sqlInjectionValidator.containsSQLInjection(input)) {
            throw new IllegalArgumentException("Potentially malicious input detected");
        }
        
        // Remove HTML tags and scripts
        String sanitized = SCRIPT_PATTERN.matcher(input).replaceAll("");
        sanitized = HTML_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove potentially dangerous characters
        sanitized = sanitized
            .replaceAll("[<>\"'&]", "") // Remove HTML special characters
            .replaceAll("\\\\", "") // Remove backslashes
            .trim();
        
        return sanitized;
    }

    public String sanitizeNote(String note) {
        if (note == null) return null;
        
        String sanitized = sanitizeText(note);
        
        // Limit length for notes
        if (sanitized.length() > 500) {
            sanitized = sanitized.substring(0, 500);
        }
        
        return sanitized;
    }

    public String sanitizeSearchQuery(String query) {
        if (query == null) return null;
        
        sqlInjectionValidator.validateSearchQuery(query);
        return sanitizeText(query);
    }

    public boolean isValidEmail(String email) {
        if (email == null) return false;
        
        // Check for SQL injection in email
        if (sqlInjectionValidator.containsSQLInjection(email)) {
            return false;
        }
        
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    public boolean isValidPhoneNumber(String phone) {
        if (phone == null) return true; // Phone is optional
        
        // Check for SQL injection in phone
        if (sqlInjectionValidator.containsSQLInjection(phone)) {
            return false;
        }
        
        return phone.matches("^[+]?[0-9\\s\\-()]{7,15}$");
    }

    public String sanitizeName(String name) {
        if (name == null) return null;
        
        String sanitized = sanitizeText(name);
        
        // Names should only contain letters, spaces, hyphens, and apostrophes
        sanitized = sanitized.replaceAll("[^a-zA-Z\\s\\-']", "");
        
        return sanitized.trim();
    }
}