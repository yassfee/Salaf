package com.salaf.repayment.controller;

import com.salaf.auth.entity.User;
import com.salaf.repayment.dto.RepaymentRequest;
import com.salaf.repayment.dto.RepaymentResponse;
import com.salaf.repayment.service.RepaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lends")
public class RepaymentController {
    private final RepaymentService repaymentService;

    public RepaymentController(RepaymentService repaymentService) {
        this.repaymentService = repaymentService;
    }

    @PostMapping("/{lendId}/repayments")
    public ResponseEntity<Map<String, Object>> recordRepayment(
            @PathVariable Long lendId,
            @Valid @RequestBody RepaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        Map<String, Object> response = repaymentService.recordRepayment(lendId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{lendId}/repayments")
    public ResponseEntity<List<RepaymentResponse>> getRepaymentHistory(
            @PathVariable Long lendId,
            @AuthenticationPrincipal User currentUser) {
        List<RepaymentResponse> history = repaymentService.getRepaymentHistory(lendId, currentUser);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{lendId}/repayments/summary")
    public ResponseEntity<Map<String, Object>> getRepaymentSummary(
            @PathVariable Long lendId,
            @AuthenticationPrincipal User currentUser) {
        Map<String, Object> summary = repaymentService.getRepaymentSummary(lendId, currentUser);
        return ResponseEntity.ok(summary);
    }
}
