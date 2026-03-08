package com.salaf.auth.controller;

import com.salaf.auth.dto.UserSearchResponse;
import com.salaf.auth.entity.User;
import com.salaf.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public List<UserSearchResponse> searchUsers(
            @RequestParam String q,
            @AuthenticationPrincipal User currentUser) {
        String pattern = "%" + q.toLowerCase() + "%";
        return userRepository
                .searchByEmailOrName(pattern)
                .stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .limit(10)
                .map(UserSearchResponse::from)
                .toList();
    }
}
