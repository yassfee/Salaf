package com.salaf.contact.controller;

import com.salaf.auth.entity.User;
import com.salaf.common.AuthorizationService;
import com.salaf.contact.dto.ContactRequest;
import com.salaf.contact.dto.ContactResponse;
import com.salaf.contact.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;
    private final AuthorizationService authorizationService;

    @GetMapping
    public List<ContactResponse> getAllContacts(@AuthenticationPrincipal User currentUser) {
        return contactService.getAllContacts(currentUser);
    }

    @PostMapping
    public ResponseEntity<ContactResponse> createContact(
            @Valid @RequestBody ContactRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contactService.createContact(request, currentUser));
    }

    @GetMapping("/mutual/{userId}")
    public Map<String, Boolean> checkMutual(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        return Map.of("mutual", contactService.isMutual(currentUser, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        
        // Verify authorization before deletion
        authorizationService.verifyContactOwnership(id, currentUser);
        
        contactService.deleteContact(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
