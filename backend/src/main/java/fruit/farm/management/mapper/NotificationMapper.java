package fruit.farm.management.mapper;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.UserEntity;

public class NotificationMapper {

    public static NotificationDTO mapFromEntity(NotificationEntity notificationEntity) {

        return new NotificationDTO(notificationEntity.getId(),
                notificationEntity.getNotificationType(), notificationEntity.getTitle(),
                notificationEntity.getMessage(), notificationEntity.getCreatedAt(), UserMapper.mapFromEntity(
                        notificationEntity.getUserEntity()));
    }

    public static NotificationEntity mapToEntity(NotificationDTO notificationDTO, UserEntity gardener) {

        return new NotificationEntity(notificationDTO.getId(),
                notificationDTO.getNotificationType(), notificationDTO.getTitle(),
                notificationDTO.getMessage(), notificationDTO.getCreatedAt(), UserMapper.mapToEntity(
                        notificationDTO.getUserDto(), gardener));
    }
}
