package fruit.farm.management.controller;

import fruit.farm.management.dto.WeatherNotificationDTO;
import fruit.farm.management.service.WeatherNotificationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/weather-notifications")
@AllArgsConstructor
@Slf4j
public class WeatherNotificationController {

    private WeatherNotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<WeatherNotificationDTO>> getAllNotifications() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            log.info("Fetching notifications for user: {}", loggedInEmail);

            List<WeatherNotificationDTO> notifications = notificationService.getAllNotificationsForUser(loggedInEmail);

            log.info("Found {} notifications", notifications.size());
            return ResponseEntity.ok(notifications);

        } catch (Exception e) {
            log.error("Error fetching notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNotificationById(@PathVariable Long id) {
        log.info("Getting notification by ID: {}", id);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();

            Optional<ResponseEntity<WeatherNotificationDTO>> weatherNotificationDTOResponseEntity = notificationService.getNotificationById(id, loggedInEmail)
                    .map(ResponseEntity::ok);
            if (weatherNotificationDTOResponseEntity.isPresent()) {
                return ResponseEntity.ok(weatherNotificationDTOResponseEntity);
            }

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to get notification"));

        } catch (Exception e) {
            log.error("Error getting notification by ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get notification: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody WeatherNotificationDTO request) {
        log.info("Creating notification: {}", request);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();

            WeatherNotificationDTO created = notificationService.createNotification(request, loggedInEmail);

            log.info("Notification created successfully with ID: {}", created.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (RuntimeException e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Creation failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNotification(@PathVariable Long id, @RequestBody WeatherNotificationDTO request) {
        log.info("Updating notification with ID: {}", id);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();

            WeatherNotificationDTO updated = notificationService.updateNotification(id, request, loggedInEmail);

            log.info("Notification updated successfully with ID: {}", id);

            return ResponseEntity.ok(updated);

        } catch (RuntimeException e) {
            log.error("Error updating notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleNotificationStatus(@PathVariable Long id) {
        log.info("Toggling notification status for ID: {}", id);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();

            WeatherNotificationDTO updated = notificationService.toggleNotificationStatus(id, loggedInEmail);

            log.info("Notification {} status toggled to: {}", id, updated.getEnabled());

            return ResponseEntity.ok(Map.of(
                    "message", "Notification status updated successfully",
                    "id", id,
                    "enabled", updated.getEnabled()
            ));

        } catch (Exception e) {
            log.error("Error toggling notification status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Toggle failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        log.info("Attempting to delete notification with ID: {}", id);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();

            notificationService.deleteNotification(id, loggedInEmail);

            log.info("Notification {} deleted successfully", id);

            return ResponseEntity.ok(Map.of(
                    "message", "Notification deleted successfully",
                    "id", id
            ));

        } catch (Exception e) {
            log.error("Error deleting notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getNotificationStats() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();

            WeatherNotificationService.NotificationStats stats =
                    notificationService.getNotificationStats(loggedInEmail);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Error fetching notification stats: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get stats: " + e.getMessage()));
        }
    }
}