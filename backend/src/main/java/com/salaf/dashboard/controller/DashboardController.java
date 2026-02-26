package com.salaf.dashboard.controller;

import com.salaf.auth.entity.User;
import com.salaf.dashboard.dto.DashboardResponse;
import com.salaf.dashboard.dto.LendSummaryDto;
import com.salaf.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // GET /api/dashboard/summary — FR-17
    @GetMapping("/summary")
    public ResponseEntity<DashboardResponse> getSummary(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getSummary(user));
    }

    // GET /api/dashboard/due-soon — FR-18
    @GetMapping("/due-soon")
    public ResponseEntity<List<LendSummaryDto>> getDueSoon(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getDueSoon(user));
    }
}
