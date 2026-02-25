package com.salaf.contact.repository;

import com.salaf.contact.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    // TODO: Add query methods:
    //   List<Contact> findByOwner(User owner)
    //   Optional<Contact> findByIdAndOwner(Long id, User owner)
}
