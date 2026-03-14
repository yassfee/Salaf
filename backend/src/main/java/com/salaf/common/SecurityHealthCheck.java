package com.salaf.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SecurityHealthCheck {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.encryption.key:}")
    private String encryptionKey;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @Autowired
    private InputSanitizer inputSanitizer;

    @Autowired
    private SQLInjectionValidator sqlInjectionValidator;

    public List<String> performSecurityCheck() {
        List<String> issues = new ArrayList<>();

        // Check JWT secret
        if (jwtSecret.equals("your-256-bit-secret-key-replace-this-in-production")) {
            issues.add("CRITICAL: Default JWT secret is being used in production");
        }

        if (jwtSecret.length() < 32) {
            issues.add("WARNING: JWT secret is too short (should be at least 32 characters)");
        }

        // Check encryption key
        if (encryptionKey.isEmpty()) {
            issues.add("WARNING: No encryption key configured - using generated key");
        }

        // Check active profile
        if (activeProfile.contains("dev") || activeProfile.contains("test")) {
            issues.add("INFO: Development/Test profile is active - ensure this is intentional");
        }

        // Test input sanitization
        try {
            String maliciousInput = "<script>alert('xss')</script>";
            String sanitized = inputSanitizer.sanitizeText(maliciousInput);
            if (sanitized.contains("<script>")) {
                issues.add("ERROR: XSS protection not working properly");
            }
        } catch (Exception e) {
            // Expected for malicious input
        }

        // Test SQL injection detection
        String sqlInjection = "'; DROP TABLE users; --";
        if (!sqlInjectionValidator.containsSQLInjection(sqlInjection)) {
            issues.add("ERROR: SQL injection detection not working properly");
        }

        // Test email validation
        if (inputSanitizer.isValidEmail("test@test.com'; DROP TABLE users; --")) {
            issues.add("ERROR: Email validation allows SQL injection");
        }

        // Test phone validation
        if (inputSanitizer.isValidPhoneNumber("<script>alert('xss')</script>")) {
            issues.add("ERROR: Phone validation allows XSS");
        }

        // Check system properties for security
        String javaVersion = System.getProperty("java.version");
        if (javaVersion.startsWith("1.8") || javaVersion.startsWith("8")) {
            issues.add("WARNING: Using older Java version - consider upgrading for security patches");
        }

        // Memory check
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long usedMemory = totalMemory - runtime.freeMemory();
        
        if (usedMemory > maxMemory * 0.9) {
            issues.add("WARNING: High memory usage detected - potential DoS risk");
        }

        // Additional security validations
        performAdvancedSecurityChecks(issues);

        if (issues.isEmpty()) {
            issues.add("All security checks passed");
        }

        return issues;
    }

    private void performAdvancedSecurityChecks(List<String> issues) {
        // Check for common security misconfigurations
        
        // Test various XSS payloads
        String[] xssPayloads = {
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>",
            "';alert('xss');//"
        };
        
        for (String payload : xssPayloads) {
            try {
                String sanitized = inputSanitizer.sanitizeText(payload);
                if (containsUnsafeContent(sanitized)) {
                    issues.add("ERROR: XSS payload not properly sanitized: " + payload.substring(0, 20) + "...");
                }
            } catch (Exception e) {
                // Expected for malicious input
            }
        }

        // Test various SQL injection payloads
        String[] sqlPayloads = {
            "1' OR '1'='1",
            "admin'--",
            "1' UNION SELECT * FROM users--",
            "'; EXEC xp_cmdshell('dir'); --"
        };
        
        for (String payload : sqlPayloads) {
            if (!sqlInjectionValidator.containsSQLInjection(payload)) {
                issues.add("ERROR: SQL injection payload not detected: " + payload.substring(0, 20) + "...");
            }
        }
    }

    private boolean containsUnsafeContent(String content) {
        if (content == null) return false;
        
        String lower = content.toLowerCase();
        return lower.contains("script") || 
               lower.contains("javascript") || 
               lower.contains("onerror") || 
               lower.contains("onload") ||
               lower.contains("alert");
    }

    public boolean isSecure() {
        List<String> issues = performSecurityCheck();
        return issues.size() == 1 && issues.get(0).equals("All security checks passed");
    }

    public SecurityReport generateDetailedReport() {
        List<String> issues = performSecurityCheck();
        boolean isSecure = isSecure();
        
        return new SecurityReport(isSecure, issues, System.currentTimeMillis());
    }

    public static class SecurityReport {
        private final boolean secure;
        private final List<String> issues;
        private final long timestamp;

        public SecurityReport(boolean secure, List<String> issues, long timestamp) {
            this.secure = secure;
            this.issues = issues;
            this.timestamp = timestamp;
        }

        public boolean isSecure() { return secure; }
        public List<String> getIssues() { return issues; }
        public long getTimestamp() { return timestamp; }
    }
}