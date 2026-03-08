package com.salaf.lend.service;

import com.salaf.auth.entity.User;
import com.salaf.contact.entity.Contact;
import com.salaf.contact.repository.ContactRepository;
import com.salaf.lend.dto.BorrowRequestDto;
import com.salaf.lend.dto.LendRequestDto;
import com.salaf.lend.dto.LendResponseDto;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LendRequestService {

    private final LendRequestRepository lendRequestRepository;
    private final ContactRepository contactRepository;

    @Transactional
    public LendResponseDto createLend(LendRequestDto req, User lender) {
        Contact borrower = contactRepository.findById(req.getContactId())
                .filter(c -> c.getOwner().getId().equals(lender.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));

        LendRequest lend = new LendRequest();
        lend.setLender(lender);
        lend.setBorrower(borrower);
        lend.setAmount(req.getAmount());
        lend.setRemainingBalance(req.getAmount());
        lend.setDueDate(req.getDueDate());
        lend.setNote(req.getNote());
        lend.setStatus(LendStatus.PENDING);

        return LendResponseDto.from(lendRequestRepository.save(lend));
    }

    public List<LendResponseDto> getLends(User lender) {
        return lendRequestRepository.findByLender(lender)
                .stream()
                .map(LendResponseDto::from)
                .toList();
    }

    public LendResponseDto getLendById(Long id, User lender) {
        return lendRequestRepository.findByIdAndLender(id, lender)
                .map(LendResponseDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend not found"));
    }

    /** Returns all lends where the current user is the borrower (incoming lends). */
    public List<LendResponseDto> getIncomingLends(User borrower) {
        return lendRequestRepository.findByBorrower_LinkedUser(borrower)
                .stream()
                .map(LendResponseDto::fromBorrowerView)
                .toList();
    }

    /** Returns a single incoming lend by id for the borrower. */
    public LendResponseDto getIncomingLendById(Long id, User borrower) {
        return lendRequestRepository.findByIdAndBorrower_LinkedUser(id, borrower)
                .map(LendResponseDto::fromBorrowerView)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend not found"));
    }

    /** Borrower accepts a pending lend. */
    @Transactional
    public LendResponseDto accept(Long id, User borrower) {
        LendRequest lend = lendRequestRepository.findByIdAndBorrower_LinkedUser(id, borrower)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend not found"));
        if (lend.getStatus() != LendStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lend is not in PENDING status");
        }
        lend.setStatus(LendStatus.ACCEPTED);
        return LendResponseDto.fromBorrowerView(lendRequestRepository.save(lend));
    }

    /** Borrower rejects a pending lend. */
    @Transactional
    public LendResponseDto reject(Long id, User borrower) {
        LendRequest lend = lendRequestRepository.findByIdAndBorrower_LinkedUser(id, borrower)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend not found"));
        if (lend.getStatus() != LendStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lend is not in PENDING status");
        }
        lend.setStatus(LendStatus.REJECTED);
        return LendResponseDto.fromBorrowerView(lendRequestRepository.save(lend));
    }

    /** Lender cancels a pending lend they created. */
    @Transactional
    public LendResponseDto cancel(Long id, User lender) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(id, lender)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend not found"));
        if (lend.getStatus() != LendStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only PENDING lends can be cancelled");
        }
        lend.setStatus(LendStatus.REJECTED);
        return LendResponseDto.from(lendRequestRepository.save(lend));
    }

    /**
     * Borrower sends a borrow request to one of their contacts (the desired lender).
     * Creates a LendRequest with status BORROW_REQUESTED; the lender must approve it.
     */
    @Transactional
    public LendResponseDto createBorrowRequest(User borrower, BorrowRequestDto dto) {
        // Verify lenderContact belongs to the borrower and is a registered user
        Contact lenderContact = contactRepository.findById(dto.getLenderContactId())
                .filter(c -> c.getOwner().getId().equals(borrower.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));

        if (lenderContact.getLinkedUser() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected contact is not a registered user");
        }
        User lender = lenderContact.getLinkedUser();

        // Find or auto-create the borrower's contact entry in the lender's contact list
        Contact borrowerContact = contactRepository.findByOwnerAndLinkedUser(lender, borrower)
                .orElseGet(() -> {
                    Contact c = new Contact();
                    c.setOwner(lender);
                    c.setLinkedUser(borrower);
                    c.setName(borrower.getName());
                    c.setEmail(borrower.getEmail());
                    c.setPhone(borrower.getPhone());
                    return contactRepository.save(c);
                });

        LendRequest lend = new LendRequest();
        lend.setLender(lender);
        lend.setBorrower(borrowerContact);
        lend.setAmount(dto.getAmount());
        lend.setRemainingBalance(dto.getAmount());
        lend.setDueDate(dto.getDueDate());
        lend.setNote(dto.getNote());
        lend.setStatus(LendStatus.BORROW_REQUESTED);

        return LendResponseDto.fromBorrowerView(lendRequestRepository.save(lend));
    }

    /** Returns all borrow requests directed at the current user as a lender. */
    public List<LendResponseDto> getBorrowRequestsForLender(User lender) {
        return lendRequestRepository.findByLenderAndStatus(lender, LendStatus.BORROW_REQUESTED)
                .stream()
                .map(LendResponseDto::from)
                .toList();
    }

    /** Lender approves a borrow request — both parties have agreed, status → ACCEPTED. */
    @Transactional
    public LendResponseDto approveBorrowRequest(Long id, User lender) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(id, lender)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrow request not found"));
        if (lend.getStatus() != LendStatus.BORROW_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not a pending borrow request");
        }
        lend.setStatus(LendStatus.ACCEPTED);
        return LendResponseDto.from(lendRequestRepository.save(lend));
    }

    /** Lender declines a borrow request. */
    @Transactional
    public LendResponseDto declineBorrowRequest(Long id, User lender) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(id, lender)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Borrow request not found"));
        if (lend.getStatus() != LendStatus.BORROW_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not a pending borrow request");
        }
        lend.setStatus(LendStatus.REJECTED);
        return LendResponseDto.from(lendRequestRepository.save(lend));
    }
}
