package com.salaf.wallet.controller;

import com.salaf.auth.entity.User;
import com.salaf.wallet.dto.SaveCardRequest;
import com.salaf.wallet.dto.TransactionRequest;
import com.salaf.wallet.dto.UpdateBalanceRequest;
import com.salaf.wallet.dto.WalletResponse;
import com.salaf.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public WalletResponse getWallet(@AuthenticationPrincipal User currentUser) {
        return walletService.getWallet(currentUser);
    }

    @PutMapping("/card")
    public WalletResponse saveCard(
            @Valid @RequestBody SaveCardRequest request,
            @AuthenticationPrincipal User currentUser) {
        return walletService.saveCard(currentUser, request);
    }

    @PostMapping("/transaction")
    public WalletResponse processTransaction(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return walletService.processTransaction(currentUser, request);
    }

    @PutMapping("/balance")
    @Deprecated(since = "1.0", forRemoval = true)
    public ResponseEntity<Map<String, String>> updateBalance(
            @RequestBody UpdateBalanceRequest request,
            @AuthenticationPrincipal User currentUser) {
        // Return error message instead of processing
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Direct balance updates are deprecated. Use /api/wallet/transaction endpoint."));
    }
}
