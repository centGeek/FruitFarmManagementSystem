package fruit.farm.management.service;

import fruit.farm.management.dto.WeatherNotificationDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WeatherNotificationEntity;
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
    public List<WeatherNotificationDto> getAllNotificationsForUser(String userNickname) {
        log.info("Fetching notifications for user: {}", userNickname);

        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

        List<WeatherNotificationEntity> notifications = notificationRepository.findByUserId(user.getId());

        log.info("Found {} notifications for user {}", notifications.size(), userNickname);

        return notifications.stream()
                .map(WeatherNotificationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<WeatherNotificationDto> getNotificationById(Long id, String userNickname) {
        log.info("Fetching notification with ID: {} for user: {}", id, userNickname);

        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

        return notificationRepository.findById(id)
                .filter(notification -> notification.getUser().getId().equals(user.getId()))
                .map(WeatherNotificationMapper::mapToDto);
    }

    @Transactional
    public WeatherNotificationDto createNotification(WeatherNotificationDto dto, String userNickname) {
        log.info("Creating notification for user: {}", userNickname);

        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

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
        entity.setDaysAhead(dto.getDaysAhead());

        WeatherNotificationEntity saved = notificationRepository.save(entity);
        log.info("Notification created with ID: {}", saved.getId());

        return WeatherNotificationMapper.mapToDto(saved);
    }

    @Transactional
    public WeatherNotificationDto updateNotification(Long id, WeatherNotificationDto dto, String userNickname) {
        log.info("Updating notification with ID: {} for user: {}", id, userNickname);

        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

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
    public WeatherNotificationDto toggleNotificationStatus(Long id, String userNickname) {
        log.info("Toggling notification status for ID: {}", id);

        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

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
    public void deleteNotification(Long id, String userNickname) {
        log.info("Deleting notification with ID: {} for user: {}", id, userNickname);

        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

        WeatherNotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted successfully", id);
    }
    @Transactional(readOnly = true)
    public List<WeatherNotificationDto> getAllActiveNotifications() {
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
    public NotificationStats getNotificationStats(String userNickname) {
        UserEntity user = userRepository.findByNickname(userNickname)
                .orElseThrow(() -> new RuntimeException("User not found: " + userNickname));

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