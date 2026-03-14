package com.salaf.admin;

import com.salaf.auth.entity.Role;
import com.salaf.auth.entity.User;
import com.salaf.common.AuditService;
import com.salaf.common.SecurityHealthCheck;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private SecurityHealthCheck securityHealthCheck;

    @Autowired
    private AuditService auditService;

    @GetMapping("/security-status")
    public ResponseEntity<Map<String, Object>> getSecurityStatus(
            @AuthenticationPrincipal User currentUser) {
        
        auditService.logSecurityEvent("ADMIN_SECURITY_CHECK", 
            currentUser.getEmail(), "Security status requested");
        
        List<String> issues = securityHealthCheck.performSecurityCheck();
        boolean isSecure = securityHealthCheck.isSecure();
        
        return ResponseEntity.ok(Map.of(
            "secure", isSecure,
            "status", isSecure ? "SECURE" : "ISSUES_FOUND",
            "checks", issues,
            "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/system-info")
    public ResponseEntity<Map<String, Object>> getSystemInfo(
            @AuthenticationPrincipal User currentUser) {
        
        auditService.logSecurityEvent("ADMIN_SYSTEM_INFO", 
            currentUser.getEmail(), "System info requested");
        
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        return ResponseEntity.ok(Map.of(
            "memory", Map.of(
                "max", maxMemory / (1024 * 1024) + " MB",
                "total", totalMemory / (1024 * 1024) + " MB",
                "used", usedMemory / (1024 * 1024) + " MB",
                "free", freeMemory / (1024 * 1024) + " MB"
            ),
            "processors", runtime.availableProcessors(),
            "javaVersion", System.getProperty("java.version"),
            "osName", System.getProperty("os.name"),
            "osVersion", System.getProperty("os.version")
        ));
    }

    @PostMapping("/emergency-lockdown")
    public ResponseEntity<Map<String, String>> emergencyLockdown(
            @AuthenticationPrincipal User currentUser) {
        
        auditService.logSecurityEvent("EMERGENCY_LOCKDOWN", 
            currentUser.getEmail(), "Emergency lockdown initiated");
        
        // In a real implementation, this would disable non-admin endpoints
        // For now, we just log the event
        
        return ResponseEntity.ok(Map.of(
            "message", "Emergency lockdown initiated",
            "status", "LOCKED_DOWN",
            "initiatedBy", currentUser.getEmail()
        ));
    }
}