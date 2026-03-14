package com.salaf.common;

import com.salaf.auth.entity.User;
import com.salaf.contact.entity.Contact;
import com.salaf.contact.repository.ContactRepository;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.notification.entity.Notification;
import com.salaf.notification.repository.NotificationRepository;
import com.salaf.repayment.entity.Repayment;
import com.salaf.repayment.repository.RepaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthorizationService {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private LendRequestRepository lendRequestRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RepaymentRepository repaymentRepository;

    @Autowired
    private AuditService auditService;

    /**
     * Verifies that the user owns the specified contact
     */
    public void verifyContactOwnership(Long contactId, User user) {
        if (contactId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));

        if (!contact.getOwner().getId().equals(user.getId())) {
            auditService.logSecurityEvent("UNAUTHORIZED_CONTACT_ACCESS", 
                user.getEmail(), "Attempted to access contact ID: " + contactId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    /**
     * Verifies that the user is either the lender or borrower of the lend request
     */
    public void verifyLendAccess(Long lendId, User user) {
        if (lendId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        LendRequest lend = lendRequestRepository.findById(lendId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend request not found"));

        boolean isLender = lend.getLender().getId().equals(user.getId());
        boolean isBorrower = lend.getBorrower().getLinkedUser() != null && 
                           lend.getBorrower().getLinkedUser().getId().equals(user.getId());

        if (!isLender && !isBorrower) {
            auditService.logSecurityEvent("UNAUTHORIZED_LEND_ACCESS", 
                user.getEmail(), "Attempted to access lend ID: " + lendId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    /**
     * Verifies that the user is the lender of the lend request
     */
    public void verifyLenderAccess(Long lendId, User user) {
        if (lendId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        LendRequest lend = lendRequestRepository.findById(lendId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend request not found"));

        if (!lend.getLender().getId().equals(user.getId())) {
            auditService.logSecurityEvent("UNAUTHORIZED_LENDER_ACCESS", 
                user.getEmail(), "Attempted lender access to lend ID: " + lendId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the lender can perform this action");
        }
    }

    /**
     * Verifies that the user is the borrower of the lend request
     */
    public void verifyBorrowerAccess(Long lendId, User user) {
        if (lendId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        LendRequest lend = lendRequestRepository.findById(lendId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lend request not found"));

        boolean isBorrower = lend.getBorrower().getLinkedUser() != null && 
                           lend.getBorrower().getLinkedUser().getId().equals(user.getId());

        if (!isBorrower) {
            auditService.logSecurityEvent("UNAUTHORIZED_BORROWER_ACCESS", 
                user.getEmail(), "Attempted borrower access to lend ID: " + lendId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the borrower can perform this action");
        }
    }

    /**
     * Verifies that the user owns the notification
     */
    public void verifyNotificationAccess(Long notificationId, User user) {
        if (notificationId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getReceiver().getId().equals(user.getId())) {
            auditService.logSecurityEvent("UNAUTHORIZED_NOTIFICATION_ACCESS", 
                user.getEmail(), "Attempted to access notification ID: " + notificationId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    /**
     * Verifies that the user can access the repayment (either as lender or borrower)
     */
    public void verifyRepaymentAccess(Long repaymentId, User user) {
        if (repaymentId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        Repayment repayment = repaymentRepository.findById(repaymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repayment not found"));

        LendRequest lend = repayment.getLendRequest();
        boolean isLender = lend.getLender().getId().equals(user.getId());
        boolean isBorrower = lend.getBorrower().getLinkedUser() != null && 
                           lend.getBorrower().getLinkedUser().getId().equals(user.getId());

        if (!isLender && !isBorrower) {
            auditService.logSecurityEvent("UNAUTHORIZED_REPAYMENT_ACCESS", 
                user.getEmail(), "Attempted to access repayment ID: " + repaymentId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    /**
     * Verifies that the user can delete the repayment (only borrower)
     */
    public void verifyRepaymentDeletionAccess(Long repaymentId, User user) {
        if (repaymentId == null || user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid parameters");
        }

        Repayment repayment = repaymentRepository.findById(repaymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repayment not found"));

        LendRequest lend = repayment.getLendRequest();
        boolean isBorrower = lend.getBorrower().getLinkedUser() != null && 
                           lend.getBorrower().getLinkedUser().getId().equals(user.getId());

        if (!isBorrower) {
            auditService.logSecurityEvent("UNAUTHORIZED_REPAYMENT_DELETION", 
                user.getEmail(), "Attempted to delete repayment ID: " + repaymentId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the borrower can delete repayments");
        }
    }

    /**
     * Checks if user has reached their daily transaction limit
     */
    public void checkDailyTransactionLimit(User user, int currentTransactions) {
        final int DAILY_LIMIT = 50; // Reasonable daily limit
        
        if (currentTransactions >= DAILY_LIMIT) {
            auditService.logSecurityEvent("DAILY_LIMIT_EXCEEDED", 
                user.getEmail(), "Daily transaction limit exceeded: " + currentTransactions);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, 
                "Daily transaction limit exceeded. Please try again tomorrow.");
        }
    }
}