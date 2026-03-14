package com.salaf.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class SecurityEventListener {

    @Autowired
    private AuditService auditService;

    @Autowired
    private SessionManagementService sessionManagementService;

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        Authentication auth = event.getAuthentication();
        String username = auth.getName();
        
        auditService.logUserLogin(username, true);
        
        // Note: In a real implementation, you'd extract session ID, IP, and user agent from the request
        // This would require additional context or a custom authentication success handler
    }

    @EventListener
    public void onAuthenticationFailure(AuthenticationFailureBadCredentialsEvent event) {
        String username = event.getAuthentication().getName();
        
        auditService.logUserLogin(username, false);
        auditService.logSecurityEvent("AUTHENTICATION_FAILURE", username, 
            "Bad credentials provided");
    }
}