package com.salaf.common;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

@Aspect
@Component
public class RequestValidationAspect {

    private static final Logger logger = LoggerFactory.getLogger(RequestValidationAspect.class);

    @Autowired
    private InputSanitizer inputSanitizer;

    @Autowired
    private AuditService auditService;

    @Before("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PatchMapping)")
    public void validateRequest(JoinPoint joinPoint) {
        try {
            HttpServletRequest request = getCurrentRequest();
            if (request == null) return;

            String userAgent = request.getHeader("User-Agent");
            String referer = request.getHeader("Referer");
            
            // Log suspicious user agents
            if (userAgent != null && isSuspiciousUserAgent(userAgent)) {
                logger.warn("Suspicious User-Agent detected: {} from IP: {}", 
                    userAgent, getClientIp(request));
                auditService.logSecurityEvent("SUSPICIOUS_USER_AGENT", 
                    request.getRemoteUser(), "User-Agent: " + userAgent);
            }

            // Validate request parameters
            Object[] args = joinPoint.getArgs();
            for (Object arg : args) {
                if (arg != null) {
                    validateRequestObject(arg, request);
                }
            }

        } catch (Exception e) {
            logger.error("Error in request validation aspect", e);
        }
    }

    private void validateRequestObject(Object obj, HttpServletRequest request) {
        // Use reflection to validate string fields in request objects
        Arrays.stream(obj.getClass().getDeclaredFields())
            .filter(field -> field.getType() == String.class)
            .forEach(field -> {
                try {
                    field.setAccessible(true);
                    String value = (String) field.get(obj);
                    if (value != null && containsMaliciousContent(value)) {
                        logger.warn("Malicious content detected in field: {} from IP: {}", 
                            field.getName(), getClientIp(request));
                        auditService.logSecurityEvent("MALICIOUS_INPUT", 
                            request.getRemoteUser(), 
                            "Field: " + field.getName() + ", IP: " + getClientIp(request));
                    }
                } catch (IllegalAccessException e) {
                    // Ignore reflection errors
                }
            });
    }

    private boolean containsMaliciousContent(String value) {
        return value.contains("<script>") || 
               value.contains("javascript:") || 
               value.contains("data:text/html") ||
               value.contains("vbscript:") ||
               value.matches(".*\\b(union|select|insert|update|delete|drop)\\b.*");
    }

    private boolean isSuspiciousUserAgent(String userAgent) {
        String lowerUA = userAgent.toLowerCase();
        return lowerUA.contains("sqlmap") ||
               lowerUA.contains("nikto") ||
               lowerUA.contains("nessus") ||
               lowerUA.contains("burp") ||
               lowerUA.contains("scanner") ||
               lowerUA.contains("bot") && !lowerUA.contains("googlebot") ||
               lowerUA.length() < 10 ||
               lowerUA.length() > 500;
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}