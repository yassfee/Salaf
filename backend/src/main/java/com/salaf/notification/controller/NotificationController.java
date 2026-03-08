package com.salaf.notification.controller;

import com.salaf.auth.entity.User;
import com.salaf.notification.dto.NotificationResponse;
import com.salaf.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** Lender notifies borrower about a lend */
    @PostMapping("/lend/{lendId}")
    public ResponseEntity<NotificationResponse> sendNotification(
            @PathVariable Long lendId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String note = body.get("note");
        NotificationResponse response = notificationService.sendNotification(lendId, note, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Borrower fetches their notifications */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(notificationService.getMyNotifications(currentUser));
    }

    /** Mark a single notification as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markAsRead(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    /** Mark all notifications as read */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.noContent().build();
    }

    /** Delete a notification */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notificationService.deleteNotification(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    /** Unread count for bell badge */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        long count = notificationService.getUnreadCount(currentUser);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
