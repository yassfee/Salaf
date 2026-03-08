package com.salaf.intelligence.controller;

import com.salaf.auth.entity.User;
import com.salaf.intelligence.dto.IntelligenceSummaryResponse;
import com.salaf.intelligence.dto.RiskyLendResponse;
import com.salaf.intelligence.service.IntelligenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
        IntelligenceSummaryResponse summary = intelligenceService.getSummary(currentUser);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/risk")
    public ResponseEntity<List<RiskyLendResponse>> getRiskyLends(@AuthenticationPrincipal User currentUser) {
        List<RiskyLendResponse> riskyLends = intelligenceService.getRiskyLends(currentUser);
        return ResponseEntity.ok(riskyLends);
    }

    @GetMapping("/trust-score/{contactId}")
    public ResponseEntity<String> getTrustScore(@PathVariable Long contactId, @AuthenticationPrincipal User currentUser) {
        // Optional endpoint - can be implemented later
        return ResponseEntity.ok("Trust score feature coming soon");
    }

    @GetMapping("/suggestions")
    public ResponseEntity<String> getSuggestions(@AuthenticationPrincipal User currentUser) {
        // Optional endpoint - can be implemented later
        return ResponseEntity.ok("Suggestions feature coming soon");
    }
}
