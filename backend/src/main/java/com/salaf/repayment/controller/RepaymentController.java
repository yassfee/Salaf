package com.salaf.repayment.controller;

import com.salaf.auth.entity.User;
import com.salaf.repayment.dto.MyRepaymentResponse;
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
public class RepaymentController {
    private final RepaymentService repaymentService;

    public RepaymentController(RepaymentService repaymentService) {
        this.repaymentService = repaymentService;
    }

    @GetMapping("/api/repayments/mine")
    public ResponseEntity<List<MyRepaymentResponse>> getMyRepayments(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(repaymentService.getMyRepayments(currentUser));
    }

    @PostMapping("/api/lends/{lendId}/repayments")
    public ResponseEntity<Map<String, Object>> recordRepayment(
            @PathVariable Long lendId,
            @Valid @RequestBody RepaymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        Map<String, Object> response = repaymentService.recordRepayment(lendId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/lends/{lendId}/repayments")
    public ResponseEntity<List<RepaymentResponse>> getRepaymentHistory(
            @PathVariable Long lendId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(repaymentService.getRepaymentHistory(lendId, currentUser));
    }

    @GetMapping("/api/lends/{lendId}/repayments/summary")
    public ResponseEntity<Map<String, Object>> getRepaymentSummary(
            @PathVariable Long lendId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(repaymentService.getRepaymentSummary(lendId, currentUser));
    }
}
