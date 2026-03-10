package com.salaf.notification.service;

import com.salaf.auth.entity.User;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.repository.LendRequestRepository;
import com.salaf.notification.dto.NotificationResponse;
import com.salaf.notification.entity.Notification;
import com.salaf.notification.entity.NotificationType;
import com.salaf.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final LendRequestRepository lendRequestRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               LendRequestRepository lendRequestRepository) {
        this.notificationRepository = notificationRepository;
        this.lendRequestRepository = lendRequestRepository;
    }

    @Transactional
    public NotificationResponse sendNotification(Long lendId, String note, User sender) {
        LendRequest lend = lendRequestRepository.findByIdAndLender(lendId, sender)
                .orElseThrow(() -> new IllegalArgumentException("Lend not found or you are not the lender"));

        if (lend.getBorrower().getLinkedUser() == null) {
            throw new IllegalArgumentException("Borrower has no linked user account and cannot receive notifications");
        }

        Notification notification = new Notification();
        notification.setLendRequest(lend);
        notification.setSender(sender);
        notification.setReceiver(lend.getBorrower().getLinkedUser());
        notification.setType(NotificationType.REMINDER);
        notification.setNote(note);
        notificationRepository.save(notification);

        return NotificationResponse.from(notification);
    }

    public List<NotificationResponse> getMyNotifications(User receiver) {
        return notificationRepository.findByReceiverOrderByCreatedAtDesc(receiver)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, User receiver) {
        Notification notification = notificationRepository.findByIdAndReceiver(notificationId, receiver)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User receiver) {
        List<Notification> unread = notificationRepository.findByReceiverOrderByCreatedAtDesc(receiver)
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(Long notificationId, User receiver) {
        Notification notification = notificationRepository.findByIdAndReceiver(notificationId, receiver)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notificationRepository.delete(notification);
    }

    public long getUnreadCount(User receiver) {
        return notificationRepository.countByReceiverAndReadFalse(receiver);
    }
}
