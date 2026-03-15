package com.salaf.contact.service;

import com.salaf.auth.entity.User;
import com.salaf.auth.repository.UserRepository;
import com.salaf.common.AuditService;
import com.salaf.common.InputSanitizer;
import com.salaf.contact.dto.ContactRequest;
import com.salaf.contact.dto.ContactResponse;
import com.salaf.contact.entity.Contact;
import com.salaf.contact.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactService {

    private static final Logger logger = LoggerFactory.getLogger(ContactService.class);
    
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final InputSanitizer inputSanitizer;
    private final AuditService auditService;

    public List<ContactResponse> getAllContacts(User currentUser) {
        return contactRepository.findAllByOwner(currentUser)
                .stream()
                .map(ContactResponse::from)
                .toList();
    }

    @Transactional
    public ContactResponse createContact(ContactRequest request, User currentUser) {
        // Validate and sanitize input
        if (!inputSanitizer.isValidEmail(request.getLinkedUserEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email format");
        }

        User linkedUser = userRepository.findByEmail(request.getLinkedUserEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No registered user found with email: " + request.getLinkedUserEmail()));

        if (linkedUser.getId().equals(currentUser.getId())) {
            auditService.logSecurityEvent("SELF_CONTACT_ATTEMPT", currentUser.getEmail(), 
                "User attempted to add themselves as contact");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot add yourself as a contact");
        }

        if (contactRepository.existsByOwnerAndLinkedUser(currentUser, linkedUser)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This user is already in your contacts");
        }

        // Check contact limit (prevent spam)
        long contactCount = contactRepository.countByOwner(currentUser);
        if (contactCount >= 1000) { // Reasonable limit
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact limit reached");
        }

        Contact contact = new Contact();
        contact.setName(inputSanitizer.sanitizeName(linkedUser.getName()));
        contact.setEmail(linkedUser.getEmail());
        contact.setPhone(inputSanitizer.sanitizeText(linkedUser.getPhone()));
        contact.setLinkedUser(linkedUser);
        contact.setOwner(currentUser);
        
        Contact saved = contactRepository.save(contact);
        logger.info("Contact created by user: {} for user: {}", currentUser.getEmail(), linkedUser.getEmail());
        
        return ContactResponse.from(saved);
    }

    public boolean isMutual(User currentUser, Long otherUserId) {
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return contactRepository.existsByOwnerAndLinkedUser(otherUser, currentUser);
    }

    @Transactional
    public void deleteContact(Long id, User currentUser) {
        // Validate contact ID
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid contact ID");
        }

        Contact contact = contactRepository.findByIdAndOwner(id, currentUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));

        // Check if contact is used in active lends
        // This would require additional repository methods to check
        
        contactRepository.delete(contact);
        logger.info("Contact deleted by user: {} - Contact ID: {}", currentUser.getEmail(), id);
    }
}
