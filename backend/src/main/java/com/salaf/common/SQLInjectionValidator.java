package com.salaf.common;

import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

@Component
public class SQLInjectionValidator {

    private static final Pattern[] SQL_INJECTION_PATTERNS = {
        // Union-based injection
        Pattern.compile("(?i).*\\bunion\\b.*\\bselect\\b.*", Pattern.CASE_INSENSITIVE),
        
        // Boolean-based blind injection
        Pattern.compile("(?i).*(\\bor\\b|\\band\\b)\\s+\\d+\\s*=\\s*\\d+.*", Pattern.CASE_INSENSITIVE),
        
        // Time-based blind injection
        Pattern.compile("(?i).*\\b(sleep|waitfor|delay)\\s*\\(.*", Pattern.CASE_INSENSITIVE),
        
        // Error-based injection
        Pattern.compile("(?i).*\\b(extractvalue|updatexml|exp)\\s*\\(.*", Pattern.CASE_INSENSITIVE),
        
        // Stacked queries
        Pattern.compile("(?i).*;\\s*(insert|update|delete|drop|create|alter)\\b.*", Pattern.CASE_INSENSITIVE),
        
        // Comment-based injection
        Pattern.compile("(?i).*(--|#|/\\*|\\*/).*", Pattern.CASE_INSENSITIVE),
        
        // Function calls that could be dangerous
        Pattern.compile("(?i).*\\b(exec|execute|sp_|xp_).*", Pattern.CASE_INSENSITIVE),
        
        // Information schema queries
        Pattern.compile("(?i).*\\binformation_schema\\b.*", Pattern.CASE_INSENSITIVE),
        
        // System tables
        Pattern.compile("(?i).*\\b(sys\\.|master\\.|msdb\\.).*", Pattern.CASE_INSENSITIVE)
    };

    private static final Pattern[] DANGEROUS_KEYWORDS = {
        Pattern.compile("(?i)\\b(drop|delete|truncate|alter|create)\\b"),
        Pattern.compile("(?i)\\b(insert|update)\\b.*\\binto\\b"),
        Pattern.compile("(?i)\\bselect\\b.*\\bfrom\\b"),
        Pattern.compile("(?i)\\bunion\\b.*\\bselect\\b"),
        Pattern.compile("(?i)\\bexec(ute)?\\b"),
        Pattern.compile("(?i)\\bsp_\\w+"),
        Pattern.compile("(?i)\\bxp_\\w+")
    };

    public boolean containsSQLInjection(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }

        String normalizedInput = input.toLowerCase().trim();
        
        // Check against SQL injection patterns
        for (Pattern pattern : SQL_INJECTION_PATTERNS) {
            if (pattern.matcher(normalizedInput).matches()) {
                return true;
            }
        }

        // Check for dangerous keywords
        for (Pattern pattern : DANGEROUS_KEYWORDS) {
            if (pattern.matcher(normalizedInput).find()) {
                return true;
            }
        }

        return false;
    }

    public String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }

        if (containsSQLInjection(input)) {
            throw new IllegalArgumentException("Potentially malicious input detected");
        }

        // Remove or escape potentially dangerous characters
        return input
            .replaceAll("['\"\\\\]", "") // Remove quotes and backslashes
            .replaceAll("[;]", "") // Remove semicolons
            .replaceAll("--", "") // Remove SQL comments
            .replaceAll("/\\*.*?\\*/", "") // Remove block comments
            .trim();
    }

    public void validateSearchQuery(String query) {
        if (query == null) {
            return;
        }

        if (containsSQLInjection(query)) {
            throw new IllegalArgumentException("Invalid search query format");
        }

        // Additional validation for search queries
        if (query.length() > 100) {
            throw new IllegalArgumentException("Search query too long");
        }

        // Only allow alphanumeric, spaces, and basic punctuation
        if (!query.matches("^[a-zA-Z0-9\\s\\-_.@]+$")) {
            throw new IllegalArgumentException("Search query contains invalid characters");
        }
    }
}