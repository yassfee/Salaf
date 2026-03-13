package com.salaf.auth.controller;

import com.salaf.auth.dto.UserBadgesDto;
import com.salaf.auth.dto.UserSearchResponse;
import com.salaf.auth.entity.User;
import com.salaf.auth.repository.UserRepository;
import com.salaf.lend.entity.LendStatus;
import com.salaf.lend.repository.LendRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final LendRequestRepository lendRequestRepository;

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

    @GetMapping("/{userId}/badges")
    public UserBadgesDto getUserBadges(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        int completedLends = lendRequestRepository
                .findByLenderAndStatusIn(target, List.of(LendStatus.PAID)).size();

        int overdueAsLender = lendRequestRepository
                .findByLenderAndStatusIn(target, List.of(LendStatus.OVERDUE)).size();

        List<?> overdueAsBorrower = lendRequestRepository
                .findByBorrower_LinkedUserAndStatusIn(target, List.of(LendStatus.OVERDUE));
        int overdueCount = overdueAsLender + overdueAsBorrower.size();

        var outstandingList = lendRequestRepository
                .findByBorrower_LinkedUserAndStatusIn(target, List.of(LendStatus.ACCEPTED, LendStatus.PARTIALLY_PAID));
        BigDecimal outstandingBorrowed = outstandingList.stream()
                .map(l -> l.getRemainingBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var allAsLender = lendRequestRepository.findByLender(target);
        var allAsBorrower = lendRequestRepository.findByBorrower_LinkedUser(target);
        boolean hasActivity = !allAsLender.isEmpty() || !allAsBorrower.isEmpty();

        boolean onTimeHero = hasActivity && overdueCount == 0;
        boolean trustedLender = completedLends >= 10;
        boolean debtFree = !allAsBorrower.isEmpty() && outstandingBorrowed.compareTo(BigDecimal.ZERO) == 0;

        return new UserBadgesDto(onTimeHero, trustedLender, debtFree,
                completedLends, overdueCount, outstandingBorrowed.toPlainString());
    }
}
