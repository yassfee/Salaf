package com.salaf.auth.service;

import com.salaf.auth.dto.AuthResponse;
import com.salaf.auth.dto.ChangePasswordRequest;
import com.salaf.auth.dto.LoginRequest;
import com.salaf.auth.dto.RegisterRequest;
import com.salaf.auth.entity.User;
import com.salaf.auth.repository.UserRepository;
import com.salaf.auth.security.JwtService;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final LendRequestRepository lendRequestRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       LendRequestRepository lendRequestRepository) {
        this.userRepository      = userRepository;
        this.passwordEncoder     = passwordEncoder;
        this.jwtService          = jwtService;
        this.authenticationManager = authenticationManager;
        this.lendRequestRepository = lendRequestRepository;
    }

    // ── Register (FR-1) ───────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getName(), user.getEmail());
    }

    // ── Login (FR-2) ──────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException if wrong credentials (Spring handles it)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getName(), user.getEmail());
    }

    // ── Change Password ───────────────────────────────────────────────────────

    public void changePassword(ChangePasswordRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ── Delete Account ────────────────────────────────────────────────────────

    @Transactional
    public void deleteAccount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check for active lends before deletion
        boolean hasActiveLends = lendRequestRepository.existsByLenderIdAndStatusIn(
                user.getId(), 
                List.of(LendStatus.PENDING, LendStatus.ACCEPTED, LendStatus.ACTIVE, LendStatus.PARTIALLY_PAID)
        ) || lendRequestRepository.existsByBorrower_LinkedUserIdAndStatusIn(
                user.getId(),
                List.of(LendStatus.PENDING, LendStatus.ACCEPTED, LendStatus.ACTIVE, LendStatus.PARTIALLY_PAID)
        );

        if (hasActiveLends) {
            throw new IllegalStateException("Cannot delete account with active lends or pending requests");
        }

        userRepository.delete(user);
    }
}
