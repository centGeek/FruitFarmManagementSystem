package fruit.farm.management.controller;

import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.service.NotificationService;
import fruit.farm.management.service.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notification")
@AllArgsConstructor
@Slf4j
public class NotificationController {

    private NotificationService notificationService;
    private UserService userService;
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getAllNotifications() {

        log.info("Fetching all notifications");
        UserDto loggedUser = userService.getLoggedUser();
        List<NotificationDto> notifications = notificationService.getAllNotificationsByUserSortedByDate(loggedUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDto>> getNotificationsByUser(@PathVariable Long userId) {

        log.info("Fetching notifications for user with id: {}", userId);
        List<NotificationDto> notifications = notificationService.getNotificationsByUserSortedByDate(userId);
        return ResponseEntity.ok(notifications);
    }
}