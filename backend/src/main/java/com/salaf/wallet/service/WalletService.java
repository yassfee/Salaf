package com.salaf.wallet.service;

import com.salaf.auth.entity.User;
import com.salaf.wallet.dto.SaveCardRequest;
import com.salaf.wallet.dto.UpdateBalanceRequest;
import com.salaf.wallet.dto.WalletResponse;
import com.salaf.wallet.entity.Wallet;
import com.salaf.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;

    private Wallet getOrCreate(User user) {
        return walletRepository.findByUser(user).orElseGet(() -> {
            Wallet w = new Wallet();
            w.setUser(user);
            return walletRepository.save(w);
        });
    }

    public WalletResponse getWallet(User user) {
        return WalletResponse.from(getOrCreate(user));
    }

    @Transactional
    public WalletResponse saveCard(User user, SaveCardRequest req) {
        Wallet w = getOrCreate(user);
        w.setLast4(req.last4());
        w.setBrand(req.brand());
        w.setCardholderName(req.cardholderName());
        w.setExpiryMonth(req.expiryMonth());
        w.setExpiryYear(req.expiryYear());
        return WalletResponse.from(walletRepository.save(w));
    }

    @Transactional
    public WalletResponse updateBalance(User user, UpdateBalanceRequest req) {
        Wallet w = getOrCreate(user);
        w.setBalance(req.balance());
        return WalletResponse.from(walletRepository.save(w));
    }
}
