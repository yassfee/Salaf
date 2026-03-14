package com.salaf.common;

import com.salaf.auth.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class SessionManagementService {

    @Autowired
    private AuditService auditService;

    private final ConcurrentMap<String, UserSession> activeSessions = new ConcurrentHashMap<>();
    private final ConcurrentMap<Long, String> userToSessionMap = new ConcurrentHashMap<>();

    public void createSession(String sessionId, User user, String ipAddress, String userAgent) {
        // Check if user already has an active session
        String existingSessionId = userToSessionMap.get(user.getId());
        if (existingSessionId != null) {
            // Log potential session hijacking
            UserSession existingSession = activeSessions.get(existingSessionId);
            if (existingSession != null && !existingSession.getIpAddress().equals(ipAddress)) {
                auditService.logSecurityEvent("MULTIPLE_SESSIONS_DETECTED", 
                    user.getEmail(), 
                    "New IP: " + ipAddress + ", Existing IP: " + existingSession.getIpAddress());
            }
            
            // Invalidate existing session
            invalidateSession(existingSessionId);
        }

        UserSession session = new UserSession(sessionId, user.getId(), user.getEmail(), 
                                            ipAddress, userAgent, LocalDateTime.now());
        activeSessions.put(sessionId, session);
        userToSessionMap.put(user.getId(), sessionId);
        
        auditService.logSecurityEvent("SESSION_CREATED", user.getEmail(), 
            "IP: " + ipAddress + ", User-Agent: " + userAgent);
    }

    public void updateSessionActivity(String sessionId) {
        UserSession session = activeSessions.get(sessionId);
        if (session != null) {
            session.setLastActivity(LocalDateTime.now());
        }
    }

    public void invalidateSession(String sessionId) {
        UserSession session = activeSessions.remove(sessionId);
        if (session != null) {
            userToSessionMap.remove(session.getUserId());
            auditService.logSecurityEvent("SESSION_INVALIDATED", session.getUserEmail(), 
                "Session ID: " + sessionId);
        }
    }

    public boolean isValidSession(String sessionId) {
        UserSession session = activeSessions.get(sessionId);
        if (session == null) {
            return false;
        }

        // Check if session has expired (24 hours of inactivity)
        if (session.getLastActivity().isBefore(LocalDateTime.now().minusHours(24))) {
            invalidateSession(sessionId);
            return false;
        }

        return true;
    }

    public UserSession getSession(String sessionId) {
        return activeSessions.get(sessionId);
    }

    public int getActiveSessionCount() {
        return activeSessions.size();
    }

    public void cleanupExpiredSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        activeSessions.entrySet().removeIf(entry -> {
            if (entry.getValue().getLastActivity().isBefore(cutoff)) {
                userToSessionMap.remove(entry.getValue().getUserId());
                return true;
            }
            return false;
        });
    }

    public static class UserSession {
        private final String sessionId;
        private final Long userId;
        private final String userEmail;
        private final String ipAddress;
        private final String userAgent;
        private final LocalDateTime createdAt;
        private LocalDateTime lastActivity;

        public UserSession(String sessionId, Long userId, String userEmail, 
                          String ipAddress, String userAgent, LocalDateTime createdAt) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.userEmail = userEmail;
            this.ipAddress = ipAddress;
            this.userAgent = userAgent;
            this.createdAt = createdAt;
            this.lastActivity = createdAt;
        }

        // Getters and setters
        public String getSessionId() { return sessionId; }
        public Long getUserId() { return userId; }
        public String getUserEmail() { return userEmail; }
        public String getIpAddress() { return ipAddress; }
        public String getUserAgent() { return userAgent; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getLastActivity() { return lastActivity; }
        public void setLastActivity(LocalDateTime lastActivity) { this.lastActivity = lastActivity; }
    }
}