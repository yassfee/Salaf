package com.salaf.contact.dto;

import com.salaf.contact.entity.Contact;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private Long linkedUserId;
    private LocalDateTime createdAt;

    public static ContactResponse from(Contact contact) {
        return ContactResponse.builder()
                .id(contact.getId())
                .name(contact.getName())
                .phone(contact.getPhone())
                .email(contact.getEmail())
                .linkedUserId(contact.getLinkedUser() != null ? contact.getLinkedUser().getId() : null)
                .createdAt(contact.getCreatedAt())
                .build();
    }
}
