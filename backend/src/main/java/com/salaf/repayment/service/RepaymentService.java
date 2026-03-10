package com.salaf.repayment.service;

import com.salaf.auth.entity.User;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.repayment.dto.MyRepaymentResponse;
import com.salaf.repayment.dto.RepaymentRequest;
import com.salaf.repayment.dto.RepaymentResponse;
import com.salaf.repayment.entity.Repayment;
import com.salaf.repayment.repository.RepaymentRepository;
import com.salaf.wallet.entity.Wallet;
import com.salaf.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RepaymentService {
    private final RepaymentRepository repaymentRepository;
    private final LendRequestRepository lendRequestRepository;
    private final WalletRepository walletRepository;

    public RepaymentService(RepaymentRepository repaymentRepository,
                           LendRequestRepository lendRequestRepository,
                           WalletRepository walletRepository) {
        this.repaymentRepository = repaymentRepository;
        this.lendRequestRepository = lendRequestRepository;
        this.walletRepository = walletRepository;
    }

    private void adjustBalance(User user, BigDecimal delta) {
        if (user == null) return;
        Wallet wallet = walletRepository.findByUser(user).orElseGet(() -> {
            Wallet w = new Wallet();
            w.setUser(user);
            return walletRepository.save(w);
        });
        wallet.setBalance(wallet.getBalance().add(delta));
        walletRepository.save(wallet);
    }

    @Transactional
    public Map<String, Object> recordRepayment(Long lendId, RepaymentRequest request, User currentUser) {
        // Borrower records the repayment — verify the current user is the borrower
        LendRequest lendRequest = lendRequestRepository.findByIdAndBorrower_LinkedUser(lendId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Lend request not found or you are not the borrower"));

        // Validate amount
        if (request.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount paid must be greater than 0");
        }

        // Check remaining balance
        if (request.getAmountPaid().compareTo(lendRequest.getRemainingBalance()) > 0) {
            throw new IllegalArgumentException("Amount paid exceeds remaining balance");
        }

        // Create and save repayment
        Repayment repayment = new Repayment();
        repayment.setLendRequest(lendRequest);
        repayment.setAmountPaid(request.getAmountPaid());
        repayment.setNote(request.getNote());
        repaymentRepository.save(repayment);

        // Update remaining balance
        BigDecimal newBalance = lendRequest.getRemainingBalance().subtract(request.getAmountPaid());
        lendRequest.setRemainingBalance(newBalance);

        // Update status based on remaining balance
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            lendRequest.setStatus(LendStatus.PAID);
        } else if (newBalance.compareTo(lendRequest.getAmount()) < 0) {
            lendRequest.setStatus(LendStatus.PARTIALLY_PAID);
        }

        lendRequestRepository.save(lendRequest);

        // Adjust wallet balances: borrower pays out, lender receives
        adjustBalance(currentUser, request.getAmountPaid().negate());
        adjustBalance(lendRequest.getLender(), request.getAmountPaid());

        // Return summary
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Repayment recorded successfully");
        response.put("amountPaid", request.getAmountPaid());
        response.put("remainingBalance", newBalance);
        response.put("status", lendRequest.getStatus().name());
        
        return response;
    }

    public List<RepaymentResponse> getRepaymentHistory(Long lendId, User currentUser) {
        // Allow both lender and borrower to view history
        boolean isLender = lendRequestRepository.findByIdAndLender(lendId, currentUser).isPresent();
        boolean isBorrower = lendRequestRepository.findByIdAndBorrower_LinkedUser(lendId, currentUser).isPresent();
        if (!isLender && !isBorrower) {
            throw new IllegalArgumentException("Lend request not found or access denied");
        }
        return repaymentRepository.findByLendRequestIdOrderByPaidAtDesc(lendId)
                .stream()
                .map(RepaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRepayment(Long repaymentId, User currentUser) {
        Repayment repayment = repaymentRepository.findById(repaymentId)
                .orElseThrow(() -> new IllegalArgumentException("Repayment not found"));

        LendRequest lend = repayment.getLendRequest();
        boolean isBorrower = lend.getBorrower().getLinkedUser() != null &&
                lend.getBorrower().getLinkedUser().getId().equals(currentUser.getId());
        if (!isBorrower) {
            throw new IllegalArgumentException("Access denied");
        }

        // Restore remaining balance
        BigDecimal restored = lend.getRemainingBalance().add(repayment.getAmountPaid());
        lend.setRemainingBalance(restored);

        // Recalculate status
        if (restored.compareTo(lend.getAmount()) == 0) {
            lend.setStatus(LendStatus.ACTIVE);
        } else {
            lend.setStatus(LendStatus.PARTIALLY_PAID);
        }

        lendRequestRepository.save(lend);

        // Reverse the wallet adjustment: borrower gets back, lender gives back
        adjustBalance(currentUser, repayment.getAmountPaid());
        adjustBalance(lend.getLender(), repayment.getAmountPaid().negate());

        repaymentRepository.delete(repayment);
    }

    @Transactional(readOnly = true)
    public List<MyRepaymentResponse> getMyRepayments(User currentUser) {
        return repaymentRepository.findByBorrowerLinkedUser(currentUser)
                .stream()
                .map(MyRepaymentResponse::from)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getRepaymentSummary(Long lendId, User currentUser) {
        LendRequest lendRequest = lendRequestRepository.findByIdAndLender(lendId, currentUser)
                .or(() -> lendRequestRepository.findByIdAndBorrower_LinkedUser(lendId, currentUser))
                .orElseThrow(() -> new IllegalArgumentException("Lend request not found or access denied"));

        List<Repayment> repayments = repaymentRepository.findByLendRequestId(lendId);
        
        BigDecimal totalPaid = repayments.stream()
                .map(Repayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAmount", lendRequest.getAmount());
        summary.put("totalPaid", totalPaid);
        summary.put("totalRemaining", lendRequest.getRemainingBalance());
        summary.put("repaymentCount", repayments.size());
        summary.put("status", lendRequest.getStatus().name());
        
        return summary;
    }
}
