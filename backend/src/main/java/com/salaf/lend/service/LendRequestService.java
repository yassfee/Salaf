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
import com.salaf.notification.entity.Notification;
import com.salaf.notification.entity.NotificationType;
import com.salaf.notification.repository.NotificationRepository;
import com.salaf.wallet.entity.Wallet;
import com.salaf.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LendRequestService {

    private final LendRequestRepository lendRequestRepository;
    private final ContactRepository contactRepository;
    private final NotificationRepository notificationRepository;
    private final WalletRepository walletRepository;

    private void adjustBalance(User user, BigDecimal delta) {
        Wallet wallet = walletRepository.findByUser(user).orElseGet(() -> {
            Wallet w = new Wallet();
            w.setUser(user);
            return walletRepository.save(w);
        });
        wallet.setBalance(wallet.getBalance().add(delta));
        walletRepository.save(wallet);
    }

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

        LendRequest saved = lendRequestRepository.save(lend);

        // Notify borrower if they have a linked user account
        if (borrower.getLinkedUser() != null) {
            Notification n = new Notification();
            n.setLendRequest(saved);
            n.setSender(lender);
            n.setReceiver(borrower.getLinkedUser());
            n.setType(NotificationType.LEND_REQUEST);
            n.setNote(lender.getName() + " sent you a lend request of " + req.getAmount() + " BD");
            notificationRepository.save(n);
        }

        return LendResponseDto.from(saved);
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
        LendResponseDto result = LendResponseDto.fromBorrowerView(lendRequestRepository.save(lend));
        // Money exchanged: lender pays out, borrower receives
        adjustBalance(lend.getLender(), lend.getAmount().negate());
        if (lend.getBorrower().getLinkedUser() != null) {
            adjustBalance(lend.getBorrower().getLinkedUser(), lend.getAmount());
        }
        return result;
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

        LendRequest savedBorrow = lendRequestRepository.save(lend);

        // Notify the lender about the borrow request
        Notification n = new Notification();
        n.setLendRequest(savedBorrow);
        n.setSender(borrower);
        n.setReceiver(lender);
        n.setType(NotificationType.BORROW_REQUEST);
        n.setNote(borrower.getName() + " sent you a borrow request for " + dto.getAmount() + " BD");
        notificationRepository.save(n);

        return LendResponseDto.fromBorrowerView(savedBorrow);
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
        LendResponseDto result = LendResponseDto.from(lendRequestRepository.save(lend));
        // Money exchanged: lender pays out, borrower receives
        adjustBalance(lend.getLender(), lend.getAmount().negate());
        if (lend.getBorrower().getLinkedUser() != null) {
            adjustBalance(lend.getBorrower().getLinkedUser(), lend.getAmount());
        }
        return result;
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
