package com.salaf.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int AUTH_MAX_REQUESTS_PER_MINUTE = 5; // Stricter for auth endpoints
    private static final long WINDOW_SIZE_MS = 60_000; // 1 minute

    private final ConcurrentHashMap<String, RequestWindow> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String clientIp = getClientIp(request);
        String requestPath = request.getRequestURI();
        
        // Determine rate limit based on endpoint
        int maxRequests = requestPath.startsWith("/api/auth/") ? 
            AUTH_MAX_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;
        
        if (isRateLimited(clientIp, maxRequests)) {
            logger.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, requestPath);
            response.setStatus(429); // 429 Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Rate limit exceeded. Please try again later.\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String clientIp, int maxRequests) {
        long currentTime = System.currentTimeMillis();
        
        RequestWindow window = requestCounts.compute(clientIp, (key, existing) -> {
            if (existing == null || currentTime - existing.windowStart.get() > WINDOW_SIZE_MS) {
                return new RequestWindow(currentTime);
            }
            return existing;
        });
        
        return window.requestCount.incrementAndGet() > maxRequests;
    }

    private String getClientIp(HttpServletRequest request) {
        // Do not trust X-Forwarded-For — it can be spoofed by clients to bypass rate limiting.
        // Use the direct connection IP which cannot be faked.
        return request.getRemoteAddr();
    }

    private static class RequestWindow {
        final AtomicLong windowStart;
        final AtomicInteger requestCount;

        RequestWindow(long startTime) {
            this.windowStart = new AtomicLong(startTime);
            this.requestCount = new AtomicInteger(0);
        }
    }
}