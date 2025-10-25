package fruit.farm.management.service;

import fruit.farm.management.dto.WeatherNotificationDTO;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WeatherNotificationEntity;
import fruit.farm.management.entity.WeatherNotificationType;
import fruit.farm.management.mapper.WeatherNotificationMapper;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.jpa.WeatherNotificationJpaRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class WeatherNotificationService {

    private WeatherNotificationJpaRepository notificationRepository;
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WeatherNotificationDTO> getAllNotificationsForUser(String userEmail) {
        log.info("Fetching notifications for user: {}", userEmail);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        List<WeatherNotificationEntity> notifications = notificationRepository.findByUserId(user.getId());

        log.info("Found {} notifications for user {}", notifications.size(), userEmail);

        return notifications.stream()
                .map(WeatherNotificationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<WeatherNotificationDTO> getNotificationById(Long id, String userEmail) {
        log.info("Fetching notification with ID: {} for user: {}", id, userEmail);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        return notificationRepository.findById(id)
                .filter(notification -> notification.getUser().getId().equals(user.getId()))
                .map(WeatherNotificationMapper::mapToDto);
    }

    @Transactional
    public WeatherNotificationDTO createNotification(WeatherNotificationDTO dto, String userEmail) {
        log.info("Creating notification for user: {}", userEmail);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        if (dto.getDaysAhead() < 1 || dto.getDaysAhead() > 7) {
            throw new RuntimeException("Days ahead must be between 1 and 7");
        }

        WeatherNotificationEntity entity = WeatherNotificationMapper.mapToEntity(dto);
        entity.setUser(user);
        entity.setEnabled(true);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setWeatherNotificationType(dto.getWeatherNotificationType());
        entity.setThreshold(dto.getThreshold());
        entity.setEnabled(true);
        entity.setDaysAhead(5);

        WeatherNotificationEntity saved = notificationRepository.save(entity);
        log.info("Notification created with ID: {}", saved.getId());

        return WeatherNotificationMapper.mapToDto(saved);
    }

    @Transactional
    public WeatherNotificationDTO updateNotification(Long id, WeatherNotificationDTO dto, String userEmail) {
        log.info("Updating notification with ID: {} for user: {}", id, userEmail);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        WeatherNotificationEntity existing = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        if (dto.getDaysAhead() < 1 || dto.getDaysAhead() > 7) {
            throw new RuntimeException("Days ahead must be between 1 and 7");
        }

        existing.setWeatherNotificationType(dto.getWeatherNotificationType());
        existing.setThreshold(dto.getThreshold());
        existing.setDaysAhead(dto.getDaysAhead());
        existing.setEnabled(dto.getEnabled());

        WeatherNotificationEntity updated = notificationRepository.save(existing);
        log.info("Notification {} updated successfully", id);

        return WeatherNotificationMapper.mapToDto(updated);
    }

    @Transactional
    public WeatherNotificationDTO toggleNotificationStatus(Long id, String userEmail) {
        log.info("Toggling notification status for ID: {}", id);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        WeatherNotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notification.setEnabled(!notification.getEnabled());
        WeatherNotificationEntity updated = notificationRepository.save(notification);

        log.info("Notification {} status changed to: {}", id, updated.getEnabled());

        return WeatherNotificationMapper.mapToDto(updated);
    }

    @Transactional
    public void deleteNotification(Long id, String userEmail) {
        log.info("Deleting notification with ID: {} for user: {}", id, userEmail);

        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        WeatherNotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted successfully", id);
    }
    @Transactional(readOnly = true)
    public List<WeatherNotificationDTO> getAllActiveNotifications() {
        log.info("Fetching all active notifications for weather check");

        List<WeatherNotificationEntity> notifications = notificationRepository.findAllActiveNotifications();

        log.info("Found {} active notifications", notifications.size());

        return notifications.stream()
                .map(WeatherNotificationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateLastTriggered(Long id) {
        log.info("Updating last triggered time for notification: {}", id);

        WeatherNotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        notification.setLastTriggeredAt(LocalDateTime.now());
        notificationRepository.save(notification);

        log.info("Last triggered time updated for notification {}", id);
    }

    @Transactional(readOnly = true)
    public NotificationStats getNotificationStats(String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        List<WeatherNotificationEntity> notifications = notificationRepository.findByUserId(user.getId());

        long total = notifications.size();
        long active = notifications.stream().filter(WeatherNotificationEntity::getEnabled).count();
        long uniqueTypes = notifications.stream()
                .map(WeatherNotificationEntity::getWeatherNotificationType)
                .distinct()
                .count();

        return new NotificationStats(total, active, uniqueTypes);
    }

    @Data
    @AllArgsConstructor
    public static class NotificationStats {
        private long totalNotifications;
        private long activeNotifications;
        private long uniqueTypes;
    }
}