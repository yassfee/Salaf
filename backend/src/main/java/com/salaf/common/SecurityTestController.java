package com.salaf.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security-test")
@Profile({"dev", "test"}) // Only available in development and test profiles
public class SecurityTestController {

    @Autowired
    private InputSanitizer inputSanitizer;

    @Autowired
    private SQLInjectionValidator sqlInjectionValidator;

    @Autowired
    private SecurityHealthCheck securityHealthCheck;

    @PostMapping("/input-sanitization")
    public ResponseEntity<Map<String, Object>> testInputSanitization(@RequestBody Map<String, String> testData) {
        Map<String, Object> results = new HashMap<>();
        
        for (Map.Entry<String, String> entry : testData.entrySet()) {
            String input = entry.getValue();
            Map<String, Object> testResult = new HashMap<>();
            
            try {
                String sanitized = inputSanitizer.sanitizeText(input);
                testResult.put("original", input);
                testResult.put("sanitized", sanitized);
                testResult.put("sqlInjection", sqlInjectionValidator.containsSQLInjection(input));
                testResult.put("status", "PROCESSED");
            } catch (Exception e) {
                testResult.put("original", input);
                testResult.put("error", e.getMessage());
                testResult.put("status", "BLOCKED");
            }
            
            results.put(entry.getKey(), testResult);
        }
        
        return ResponseEntity.ok(results);
    }

    @GetMapping("/sql-injection-patterns")
    public ResponseEntity<Map<String, Object>> testSQLInjectionPatterns() {
        List<String> testPatterns = List.of(
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "1' UNION SELECT * FROM users--",
            "'; EXEC xp_cmdshell('dir'); --",
            "1' AND (SELECT COUNT(*) FROM users) > 0--",
            "normal@email.com",
            "regular text input",
            "<script>alert('xss')</script>",
            "javascript:alert('xss')"
        );
        
        Map<String, Object> results = new HashMap<>();
        
        for (String pattern : testPatterns) {
            Map<String, Object> testResult = new HashMap<>();
            testResult.put("input", pattern);
            testResult.put("detected", sqlInjectionValidator.containsSQLInjection(pattern));
            
            try {
                String sanitized = sqlInjectionValidator.sanitizeInput(pattern);
                testResult.put("sanitized", sanitized);
                testResult.put("status", "ALLOWED");
            } catch (Exception e) {
                testResult.put("error", e.getMessage());
                testResult.put("status", "BLOCKED");
            }
            
            results.put("pattern_" + testPatterns.indexOf(pattern), testResult);
        }
        
        return ResponseEntity.ok(results);
    }

    @GetMapping("/security-health")
    public ResponseEntity<Map<String, Object>> testSecurityHealth() {
        List<String> issues = securityHealthCheck.performSecurityCheck();
        boolean isSecure = securityHealthCheck.isSecure();
        
        return ResponseEntity.ok(Map.of(
            "secure", isSecure,
            "issues", issues,
            "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/email-validation")
    public ResponseEntity<Map<String, Object>> testEmailValidation(@RequestBody Map<String, String> emails) {
        Map<String, Object> results = new HashMap<>();
        
        for (Map.Entry<String, String> entry : emails.entrySet()) {
            String email = entry.getValue();
            Map<String, Object> testResult = new HashMap<>();
            
            testResult.put("email", email);
            testResult.put("valid", inputSanitizer.isValidEmail(email));
            testResult.put("sqlInjection", sqlInjectionValidator.containsSQLInjection(email));
            
            results.put(entry.getKey(), testResult);
        }
        
        return ResponseEntity.ok(results);
    }

    @GetMapping("/generate-test-data")
    public ResponseEntity<Map<String, Object>> generateTestData() {
        Map<String, Object> testData = new HashMap<>();
        
        // XSS test cases
        List<String> xssTests = List.of(
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>",
            "';alert('xss');//"
        );
        
        // SQL injection test cases
        List<String> sqlTests = List.of(
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/**/OR/**/1=1--",
            "1' UNION SELECT password FROM users--",
            "'; EXEC xp_cmdshell('whoami'); --"
        );
        
        // Email test cases
        List<String> emailTests = List.of(
            "valid@email.com",
            "invalid-email",
            "test@test.com'; DROP TABLE users; --",
            "<script>alert('xss')</script>@email.com",
            "normal.user+tag@domain.co.uk"
        );
        
        testData.put("xss_tests", xssTests);
        testData.put("sql_tests", sqlTests);
        testData.put("email_tests", emailTests);
        testData.put("instructions", "Use these test cases with the other endpoints to validate security measures");
        
        return ResponseEntity.ok(testData);
    }
}