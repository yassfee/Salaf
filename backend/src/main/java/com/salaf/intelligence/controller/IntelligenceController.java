package com.salaf.intelligence.controller;

import com.salaf.auth.entity.User;
import com.salaf.intelligence.dto.IntelligenceSummaryResponse;
import com.salaf.intelligence.dto.RepaymentPlanItem;
import com.salaf.intelligence.dto.RiskyLendResponse;
import com.salaf.intelligence.service.IntelligenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/intelligence")
public class IntelligenceController {
    private final IntelligenceService intelligenceService;

    public IntelligenceController(IntelligenceService intelligenceService) {
        this.intelligenceService = intelligenceService;
    }

    @GetMapping("/summary")
    public ResponseEntity<IntelligenceSummaryResponse> getSummary(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(intelligenceService.getSummary(currentUser));
    }

    @GetMapping("/risk")
    public ResponseEntity<List<RiskyLendResponse>> getRiskyLends(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(intelligenceService.getRiskyLends(currentUser));
    }

    /**
     * GET /api/intelligence/repayment-plan?budget=50.000&strategy=urgency
     * strategy: urgency (default) | snowball | avalanche
     * budget: optional — if omitted, shows full priority order with full amounts
     */
    @GetMapping("/repayment-plan")
    public ResponseEntity<List<RepaymentPlanItem>> getRepaymentPlan(
            @RequestParam(required = false) BigDecimal budget,
            @RequestParam(defaultValue = "urgency") String strategy,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(intelligenceService.getRepaymentPlan(currentUser, budget, strategy));
    }
}
