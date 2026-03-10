package com.salaf.auth.controller;

import com.salaf.auth.dto.AuthResponse;
import com.salaf.auth.dto.ChangePasswordRequest;
import com.salaf.auth.dto.LoginRequest;
import com.salaf.auth.dto.RegisterRequest;
import com.salaf.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/register  (FR-1)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // POST /api/auth/login  (FR-2)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // PUT /api/auth/change-password
    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        authService.changePassword(request, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // DELETE /api/auth/delete-account
    @DeleteMapping("/delete-account")
    public ResponseEntity<Map<String, String>> deleteAccount(Authentication authentication) {
        authService.deleteAccount(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
