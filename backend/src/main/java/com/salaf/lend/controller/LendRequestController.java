package com.salaf.lend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lends")
public class LendRequestController {
    // TODO: Inject LendRequestService via constructor

    // TODO: POST /api/lends  (FR-8, FR-9)
    //   Accept @Valid @RequestBody LendRequestDto
    //   Create lend with status PENDING, linked to currentUser as lender

    // TODO: GET /api/lends  (FR-17)
    //   Return all lends for currentUser (both as lender)

    // TODO: GET /api/lends/{id}  (FR-19, FR-20, FR-21)
    //   Return full lend details including repayment timeline and progress %

    // TODO: PATCH /api/lends/{id}/accept  (FR-11, FR-12)
    //   Change status from PENDING to ACCEPTED

    // TODO: PATCH /api/lends/{id}/reject  (FR-11, FR-13)
    //   Change status from PENDING to REJECTED
}
