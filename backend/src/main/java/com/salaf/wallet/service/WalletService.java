package com.salaf.wallet.service;

import com.salaf.auth.entity.User;
import com.salaf.common.EncryptionService;
import com.salaf.wallet.dto.SaveCardRequest;
import com.salaf.wallet.dto.TransactionRequest;
import com.salaf.wallet.dto.UpdateBalanceRequest;
import com.salaf.wallet.dto.WalletResponse;
import com.salaf.wallet.entity.Wallet;
import com.salaf.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private static final Logger logger = LoggerFactory.getLogger(WalletService.class);
    private final WalletRepository walletRepository;
    private final EncryptionService encryptionService;

    private Wallet getOrCreate(User user) {
        return walletRepository.findByUser(user).orElseGet(() -> {
            Wallet w = new Wallet();
            w.setUser(user);
            return walletRepository.save(w);
        });
    }

    public WalletResponse getWallet(User user) {
        Wallet wallet = getOrCreate(user);
        if (wallet.getCardholderName() != null) {
            try {
                wallet.setCardholderName(encryptionService.decrypt(wallet.getCardholderName()));
            } catch (Exception e) {
                logger.error("Failed to decrypt cardholder name for user: {}", user.getEmail());
                wallet.setCardholderName(null);
            }
        }
        return WalletResponse.from(wallet);
    }

    @Transactional
    public WalletResponse saveCard(User user, SaveCardRequest req) {
        // Validate card data
        if (req.last4() == null || req.last4().length() != 4 || !req.last4().matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid last 4 digits");
        }
        
        if (req.expiryMonth() == null || req.expiryMonth() < 1 || req.expiryMonth() > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid expiry month");
        }
        
        if (req.expiryYear() == null || req.expiryYear() < 2024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid expiry year");
        }

        Wallet w = getOrCreate(user);
        w.setLast4(req.last4());
        w.setBrand(req.brand());
        // Encrypt cardholder name
        w.setCardholderName(req.cardholderName() != null ? 
            encryptionService.encrypt(req.cardholderName()) : null);
        w.setExpiryMonth(req.expiryMonth());
        w.setExpiryYear(req.expiryYear());
        
        logger.info("Card information updated for user: {}", user.getEmail());
        return WalletResponse.from(walletRepository.save(w));
    }

    @Transactional
    public WalletResponse processTransaction(User user, TransactionRequest req) {
        Wallet w = getOrCreate(user);
        
        // Validate transaction
        if (req.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }
        
        BigDecimal newBalance;
        switch (req.type().toUpperCase()) {
            case "DEPOSIT":
                newBalance = w.getBalance().add(req.amount());
                if (newBalance.compareTo(new BigDecimal("99999.999")) > 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Balance would exceed the maximum allowed limit");
                }
                break;
            case "WITHDRAWAL":
                if (w.getBalance().compareTo(req.amount()) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
                }
                newBalance = w.getBalance().subtract(req.amount());
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid transaction type");
        }
        
        w.setBalance(newBalance);
        logger.info("Transaction processed for user: {} - Type: {}, Amount: {}", 
            user.getEmail(), req.type(), req.amount());
        
        return WalletResponse.from(walletRepository.save(w));
    }

    @Transactional
    @Deprecated(since = "1.0", forRemoval = true)
    public WalletResponse updateBalance(User user, UpdateBalanceRequest req) {
        // This method should be removed in favor of processTransaction
        logger.warn("Direct balance update attempted by user: {} - This is deprecated", user.getEmail());
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
            "Direct balance updates are not allowed. Use transaction endpoints instead.");
    }
}
