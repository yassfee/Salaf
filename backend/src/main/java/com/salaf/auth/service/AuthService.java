package com.salaf.auth.service;

import com.salaf.auth.dto.AuthResponse;
import com.salaf.auth.dto.ChangePasswordRequest;
import com.salaf.auth.dto.LoginRequest;
import com.salaf.auth.dto.RegisterRequest;
import com.salaf.auth.entity.User;
import com.salaf.auth.repository.UserRepository;
import com.salaf.auth.security.JwtService;
import com.salaf.common.AuditService;
import com.salaf.common.InputSanitizer;
import com.salaf.contact.repository.ContactRepository;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.wallet.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final LendRequestRepository lendRequestRepository;
    private final WalletRepository walletRepository;
    private final ContactRepository contactRepository;
    private final InputSanitizer inputSanitizer;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       LendRequestRepository lendRequestRepository,
                       WalletRepository walletRepository,
                       ContactRepository contactRepository,
                       InputSanitizer inputSanitizer,
                       AuditService auditService) {
        this.userRepository      = userRepository;
        this.passwordEncoder     = passwordEncoder;
        this.jwtService          = jwtService;
        this.authenticationManager = authenticationManager;
        this.lendRequestRepository = lendRequestRepository;
        this.walletRepository = walletRepository;
        this.contactRepository = contactRepository;
        this.inputSanitizer = inputSanitizer;
        this.auditService = auditService;
    }

    // ── Register (FR-1) ───────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {
        // Validate and sanitize inputs
        if (!inputSanitizer.isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        if (!inputSanitizer.isValidPhoneNumber(request.getPhone())) {
            throw new IllegalArgumentException("Invalid phone number format");
        }
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Phone number already registered");
        }

        String sanitizedName = inputSanitizer.sanitizeName(request.getName());
        String sanitizedPhone = inputSanitizer.sanitizeText(request.getPhone());

        User user = User.builder()
                .name(sanitizedName)
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(sanitizedPhone)
                .build();

        userRepository.save(user);
        logger.info("New user registered: {}", request.getEmail());
        auditService.logUserRegistration(request.getEmail());

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getName(), user.getEmail());
    }

    // ── Login (FR-2) ──────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        // Validate email format
        if (!inputSanitizer.isValidEmail(request.getEmail())) {
            logger.warn("Invalid login attempt with malformed email: {}", request.getEmail());
            throw new BadCredentialsException("Invalid credentials");
        }

        String email = request.getEmail().toLowerCase().trim();
        
        try {
            // Throws BadCredentialsException if wrong credentials (Spring handles it)
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            logger.info("Successful login for user: {}", email);
            auditService.logUserLogin(email, true);
            String token = jwtService.generateToken(user);
            return new AuthResponse(token, user.getName(), user.getEmail());
            
        } catch (BadCredentialsException e) {
            logger.warn("Failed login attempt for email: {}", email);
            auditService.logUserLogin(email, false);
            throw e;
        }
    }

    // ── Change Password ───────────────────────────────────────────────────────

    public void changePassword(ChangePasswordRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            auditService.logSecurityEvent("INVALID_PASSWORD_CHANGE_ATTEMPT", userEmail, "Current password incorrect");
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        logger.info("Password changed for user: {}", userEmail);
        auditService.logPasswordChange(userEmail);
    }

    // ── Delete Account ────────────────────────────────────────────────────────

    @Transactional
    public void deleteAccount(String userEmail) {
        logger.info("Starting account deletion process for user: {}", userEmail);
        
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
            logger.warn("Account deletion blocked for user: {} - Active lends exist", userEmail);
            auditService.logSecurityEvent("ACCOUNT_DELETION_BLOCKED", userEmail, "Active lends exist");
            throw new IllegalStateException("Cannot delete account with active lends or pending requests");
        }

        try {
            logger.info("Cleaning up related data for user: {}", userEmail);
            
            // Delete user's wallet (if exists)
            walletRepository.findByUser(user).ifPresent(wallet -> {
                logger.info("Deleting wallet for user: {}", userEmail);
                walletRepository.delete(wallet);
            });
            
            // Delete contacts where user is the owner
            logger.info("Deleting contacts owned by user: {}", userEmail);
            contactRepository.findAllByOwner(user).forEach(contact -> {
                contactRepository.delete(contact);
            });
            
            // Update contacts where user is the linked user (set to null)
            logger.info("Updating contacts that reference user: {}", userEmail);
            contactRepository.findAllByLinkedUser(user).forEach(contact -> {
                contact.setLinkedUser(null);
                contactRepository.save(contact);
            });
            
            // Now delete the user
            logger.info("Deleting user account: {}", userEmail);
            userRepository.delete(user);
            
            logger.warn("Account successfully deleted for user: {}", userEmail);
            auditService.logAccountDeletion(userEmail);
            
        } catch (Exception e) {
            logger.error("Failed to delete account for user: {} - Error: {}", userEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to delete account: " + e.getMessage());
        }
    }
}
