package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.NotificationMapper;
import fruit.farm.management.repository.NotificationRepository;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class NotificationService {

    private NotificationRepository notificationRepository;

    @Transactional
    public NotificationDTO addNotification(NotificationDTO notificationDTO, long userId, UserEntity gardener) {

        notificationDTO.setCreatedAt(LocalDateTime.now());
        NotificationEntity notificationEntity = NotificationMapper.mapToEntity(notificationDTO, gardener);
        notificationEntity.getUserEntity().setId(userId);

        NotificationEntity savedEntity = notificationRepository.save(notificationEntity);
        return NotificationMapper.mapFromEntity(savedEntity);
    }

    public List<NotificationDTO> getAllNotificationsSortedByDate() {

        List<NotificationEntity> notifications = notificationRepository.findAllByOrderByCreatedAtDesc();
        return notifications.stream()
                .map(NotificationMapper::mapFromEntity)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getNotificationsByUserSortedByDate(Long userId) {

        List<NotificationEntity> notifications = notificationRepository.findByUserEntityIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(NotificationMapper::mapFromEntity)
                .collect(Collectors.toList());
    }
}