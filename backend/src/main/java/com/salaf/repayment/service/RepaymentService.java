package com.salaf.repayment.service;

import com.salaf.auth.entity.User;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.repayment.dto.RepaymentRequest;
import com.salaf.repayment.dto.RepaymentResponse;
import com.salaf.repayment.entity.Repayment;
import com.salaf.repayment.repository.RepaymentRepository;
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

    public RepaymentService(RepaymentRepository repaymentRepository, 
                           LendRequestRepository lendRequestRepository) {
        this.repaymentRepository = repaymentRepository;
        this.lendRequestRepository = lendRequestRepository;
    }

    @Transactional
    public Map<String, Object> recordRepayment(Long lendId, RepaymentRequest request, User currentUser) {
        // Find and verify ownership
        LendRequest lendRequest = lendRequestRepository.findByIdAndLender(lendId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Lend request not found or does not belong to you"));

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

        // Return summary
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Repayment recorded successfully");
        response.put("amountPaid", request.getAmountPaid());
        response.put("remainingBalance", newBalance);
        response.put("status", lendRequest.getStatus().name());
        
        return response;
    }

    public List<RepaymentResponse> getRepaymentHistory(Long lendId, User currentUser) {
        // Verify ownership
        lendRequestRepository.findByIdAndLender(lendId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Lend request not found or does not belong to you"));

        return repaymentRepository.findByLendRequestIdOrderByPaidAtDesc(lendId)
                .stream()
                .map(RepaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getRepaymentSummary(Long lendId, User currentUser) {
        LendRequest lendRequest = lendRequestRepository.findByIdAndLender(lendId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Lend request not found or does not belong to you"));

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
