package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.NotificationType;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.NotificationMapper;
import fruit.farm.management.repository.NotificationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class NotificationService {

    private NotificationRepository notificationRepository;

    @Transactional
    public void addUserNotification(NotificationDTO notificationDTO, UserEntity gardener) {

        notificationDTO.setNotificationType(NotificationType.USER);
        addNotification(notificationDTO, gardener);
    }
    @Transactional
    public void addSectorNotification(NotificationDTO notificationDTO, UserEntity gardener) {

        notificationDTO.setNotificationType(NotificationType.SECTOR);
        addNotification(notificationDTO, gardener);
    }
    @Transactional
    public void addProfitNotification(NotificationDTO notificationDTO, UserEntity gardener) {

        notificationDTO.setNotificationType(NotificationType.PROFIT);
        addNotification(notificationDTO, gardener);
    }

    @Transactional
    public void addExpenseNotification(NotificationDTO notificationDTO, UserEntity gardener) {

        notificationDTO.setNotificationType(NotificationType.EXPENSE);
        addNotification(notificationDTO, gardener);
    }

    private void addNotification(NotificationDTO notificationDTO,  UserEntity gardener) {

        notificationDTO.setCreatedAt(LocalDateTime.now());
        NotificationEntity notificationEntity = NotificationMapper.mapToEntity(notificationDTO, gardener);
        notificationEntity.getUserEntity().setId(gardener.getId());

        NotificationEntity savedEntity = notificationRepository.save(notificationEntity);
        NotificationMapper.mapFromEntity(savedEntity);
    }


    public List<NotificationDTO> getAllNotificationsByUserSortedByDate(long userId) {

        List<NotificationEntity> notifications = notificationRepository.findAllByUserByOrderCreatedAtDesc(userId);
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