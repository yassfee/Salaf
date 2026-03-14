package com.salaf.controller;

import com.salaf.common.SecurityHealthCheck;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private SecurityHealthCheck securityHealthCheck;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Salaf Backend"));
    }

    @GetMapping("/health/security")
    public ResponseEntity<Map<String, Object>> securityHealth() {
        List<String> issues = securityHealthCheck.performSecurityCheck();
        boolean isSecure = securityHealthCheck.isSecure();
        
        return ResponseEntity.ok(Map.of(
            "secure", isSecure,
            "status", isSecure ? "SECURE" : "ISSUES_FOUND",
            "checks", issues
        ));
    }
}
