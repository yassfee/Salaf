package com.salaf.contact.service;

import com.salaf.auth.entity.User;
import com.salaf.auth.repository.UserRepository;
import com.salaf.contact.dto.ContactRequest;
import com.salaf.contact.dto.ContactResponse;
import com.salaf.contact.entity.Contact;
import com.salaf.contact.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public List<ContactResponse> getAllContacts(User currentUser) {
        return contactRepository.findAllByOwner(currentUser)
                .stream()
                .map(ContactResponse::from)
                .toList();
    }

    @Transactional
    public ContactResponse createContact(ContactRequest request, User currentUser) {
        User linkedUser = userRepository.findByEmail(request.getLinkedUserEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No registered user found with email: " + request.getLinkedUserEmail()));

        if (linkedUser.getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot add yourself as a contact");
        }

        if (contactRepository.existsByOwnerAndLinkedUser(currentUser, linkedUser)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This user is already in your contacts");
        }

        Contact contact = new Contact();
        contact.setName(linkedUser.getName());
        contact.setEmail(linkedUser.getEmail());
        contact.setPhone(linkedUser.getPhone());
        contact.setLinkedUser(linkedUser);
        contact.setOwner(currentUser);
        return ContactResponse.from(contactRepository.save(contact));
    }

    @Transactional
    public void deleteContact(Long id, User currentUser) {
        if (!contactRepository.existsByIdAndOwner(id, currentUser)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found");
        }
        contactRepository.deleteById(id);
    }
}
