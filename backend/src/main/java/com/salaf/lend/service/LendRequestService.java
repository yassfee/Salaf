package com.salaf.lend.service;

import org.springframework.stereotype.Service;

@Service
public class LendRequestService {
    // TODO: Inject LendRequestRepository and ContactRepository via constructor

    // TODO: LendResponseDto createLend(LendRequestDto req, User lender)
    //   FR-8, FR-9: Validate contact belongs to lender, build LendRequest,
    //   set status = PENDING, set remainingBalance = amount, save

    // TODO: List<LendResponseDto> getLends(User lender)
    //   Return all lends where lender matches, map to LendResponseDto

    // TODO: LendResponseDto getLendById(Long id, User lender)
    //   Find by id and lender, throw ResourceNotFoundException if not found

    // TODO: LendResponseDto accept(Long id, User user)
    //   FR-12: Find lend, ensure status is PENDING, set to ACCEPTED, save

    // TODO: LendResponseDto reject(Long id, User user)
    //   FR-13: Find lend, ensure status is PENDING, set to REJECTED, save
}
