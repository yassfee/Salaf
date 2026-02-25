package com.salaf.contact.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "contacts")
@Data
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // TODO: add remaining fields below

    // TODO: Add fields:
    //   Long id             -> @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    //   String name         -> @Column(nullable = false)
    //   String phone        -> optional
    //   String email        -> optional
    //   User owner          -> @ManyToOne @JoinColumn(name = "owner_id") -- links to the user who created this contact
    //   LocalDateTime createdAt -> @Column(updatable = false), set via @PrePersist
}
