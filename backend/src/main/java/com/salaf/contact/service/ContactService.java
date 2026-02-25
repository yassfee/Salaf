package com.salaf.contact.service;

import org.springframework.stereotype.Service;

@Service
public class ContactService {
    // TODO: Inject ContactRepository via constructor

    // TODO: List<ContactResponse> getContacts(User owner)
    //   FR-6: Fetch all contacts where owner matches, map each to ContactResponse

    // TODO: ContactResponse createContact(ContactRequest req, User owner)
    //   FR-5, FR-7: Build Contact from req, set owner, save, return ContactResponse

    // TODO: void deleteContact(Long id, User owner)
    //   Find by id and owner -- throw ResourceNotFoundException if not found, then delete
}
