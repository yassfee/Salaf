package com.salaf.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.regex.Pattern;

public class SecurityInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(SecurityInterceptor.class);
    
    private static final Pattern SUSPICIOUS_PATTERNS = Pattern.compile(
        "(?i).*(script|javascript|vbscript|onload|onerror|eval|expression|alert|confirm|prompt).*"
    );

    @Autowired
    private AuditService auditService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        
        // Check for suspicious patterns in request parameters
        request.getParameterMap().forEach((key, values) -> {
            for (String value : values) {
                if (value != null && SUSPICIOUS_PATTERNS.matcher(value).matches()) {
                    logger.warn("Suspicious input detected from IP: {} - Parameter: {} - Value: {}", 
                        getClientIp(request), key, value);
                    auditService.logSecurityEvent("SUSPICIOUS_INPUT", 
                        request.getRemoteUser(), 
                        "Parameter: " + key + ", IP: " + getClientIp(request));
                }
            }
        });

        // Add security headers
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}