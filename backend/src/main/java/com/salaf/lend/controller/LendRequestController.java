package com.salaf.lend.controller;

import com.salaf.auth.entity.User;
import com.salaf.common.AuthorizationService;
import com.salaf.lend.dto.BorrowRequestDto;
import com.salaf.lend.dto.LendRequestDto;
import com.salaf.lend.dto.LendResponseDto;
import com.salaf.lend.service.LendRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lends")
@RequiredArgsConstructor
public class LendRequestController {

    private final LendRequestService lendRequestService;
    private final AuthorizationService authorizationService;

    @PostMapping
    public ResponseEntity<LendResponseDto> createLend(
            @Valid @RequestBody LendRequestDto request,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify contact ownership before creating lend
        authorizationService.verifyContactOwnership(request.getContactId(), currentUser);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lendRequestService.createLend(request, currentUser));
    }

    @GetMapping
    public List<LendResponseDto> getLends(@AuthenticationPrincipal User currentUser) {
        return lendRequestService.getLends(currentUser);
    }

    @GetMapping("/{id}")
    public LendResponseDto getLendById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify access before returning lend details
        authorizationService.verifyLendAccess(id, currentUser);
        
        return lendRequestService.getLendById(id, currentUser);
    }

    /** Borrower accepts an incoming lend request. */
    @PatchMapping("/{id}/accept")
    public LendResponseDto accept(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify borrower access
        authorizationService.verifyBorrowerAccess(id, currentUser);
        
        return lendRequestService.accept(id, currentUser);
    }

    /** Borrower rejects an incoming lend request. */
    @PatchMapping("/{id}/reject")
    public LendResponseDto reject(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify borrower access
        authorizationService.verifyBorrowerAccess(id, currentUser);
        
        return lendRequestService.reject(id, currentUser);
    }

    /** Lender cancels a pending lend they created. */
    @PatchMapping("/{id}/cancel")
    public LendResponseDto cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify lender access
        authorizationService.verifyLenderAccess(id, currentUser);
        
        return lendRequestService.cancel(id, currentUser);
    }

    /** Returns all lends where the current user is the borrower. */
    @GetMapping("/incoming")
    public List<LendResponseDto> getIncomingLends(@AuthenticationPrincipal User currentUser) {
        return lendRequestService.getIncomingLends(currentUser);
    }

    /** Returns a single incoming lend by id for the borrower. */
    @GetMapping("/incoming/{id}")
    public LendResponseDto getIncomingLendById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify borrower access
        authorizationService.verifyBorrowerAccess(id, currentUser);
        
        return lendRequestService.getIncomingLendById(id, currentUser);
    }

    /** Borrower sends a borrow request to a contact (the desired lender). */
    @PostMapping("/borrow-request")
    public ResponseEntity<LendResponseDto> createBorrowRequest(
            @Valid @RequestBody BorrowRequestDto request,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify contact ownership before creating borrow request
        authorizationService.verifyContactOwnership(request.getLenderContactId(), currentUser);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lendRequestService.createBorrowRequest(currentUser, request));
    }

    /** Lender retrieves all borrow requests directed at them. */
    @GetMapping("/borrow-requests")
    public List<LendResponseDto> getBorrowRequests(@AuthenticationPrincipal User currentUser) {
        return lendRequestService.getBorrowRequestsForLender(currentUser);
    }

    /** Lender approves a borrow request — status → ACCEPTED. */
    @PatchMapping("/{id}/approve-borrow")
    public LendResponseDto approveBorrowRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify lender access
        authorizationService.verifyLenderAccess(id, currentUser);
        
        return lendRequestService.approveBorrowRequest(id, currentUser);
    }

    /** Lender declines a borrow request — status → REJECTED. */
    @PatchMapping("/{id}/decline-borrow")
    public LendResponseDto declineBorrowRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify lender access
        authorizationService.verifyLenderAccess(id, currentUser);
        
        return lendRequestService.declineBorrowRequest(id, currentUser);
    }
}
