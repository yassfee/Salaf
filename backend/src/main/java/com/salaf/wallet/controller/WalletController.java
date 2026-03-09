package com.salaf.wallet.controller;

import com.salaf.auth.entity.User;
import com.salaf.wallet.dto.SaveCardRequest;
import com.salaf.wallet.dto.UpdateBalanceRequest;
import com.salaf.wallet.dto.WalletResponse;
import com.salaf.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
            @RequestBody SaveCardRequest request,
            @AuthenticationPrincipal User currentUser) {
        return walletService.saveCard(currentUser, request);
    }

    @PutMapping("/balance")
    public WalletResponse updateBalance(
            @RequestBody UpdateBalanceRequest request,
            @AuthenticationPrincipal User currentUser) {
        return walletService.updateBalance(currentUser, request);
    }
}
