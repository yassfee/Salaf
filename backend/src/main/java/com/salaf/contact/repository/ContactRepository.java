package com.salaf.contact.repository;

import com.salaf.auth.entity.User;
import com.salaf.contact.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    List<Contact> findAllByOwner(User owner);
    boolean existsByIdAndOwner(Long id, User owner);
    boolean existsByOwnerAndLinkedUser(User owner, User linkedUser);
    List<Contact> findAllByLinkedUser(User linkedUser);
    Optional<Contact> findByOwnerAndLinkedUser(User owner, User linkedUser);
    Optional<Contact> findByIdAndOwner(Long id, User owner);
    long countByOwner(User owner);
}
