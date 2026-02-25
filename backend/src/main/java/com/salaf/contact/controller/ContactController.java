package com.salaf.contact.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    // TODO: Inject ContactService via constructor

    // TODO: GET /api/contacts  (FR-6)
    //   Return all contacts for the currently authenticated user
    //   Use @AuthenticationPrincipal User currentUser

    // TODO: POST /api/contacts  (FR-5, FR-7)
    //   Accept @Valid @RequestBody ContactRequest
    //   Create contact linked to currentUser, return ContactResponse with 201 status

    // TODO: DELETE /api/contacts/{id}
    //   Delete contact by id only if it belongs to currentUser, return 204
}
