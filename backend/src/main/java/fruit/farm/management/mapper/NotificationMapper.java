package fruit.farm.management.mapper;

import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.NotificationEntity;

public class NotificationMapper {

    public static NotificationDto mapFromEntity(NotificationEntity notificationEntity) {

        return new NotificationDto(notificationEntity.getId(),
                notificationEntity.getNotificationType(), notificationEntity.getTitle(),
                notificationEntity.getMessage(), notificationEntity.getCreatedAt(), UserMapper.mapFromEntity(
                        notificationEntity.getUserEntity()));
    }

    public static NotificationEntity mapToEntity(NotificationDto notificationDTO, UserDto gardener) {

        return new NotificationEntity(notificationDTO.getId(),
                notificationDTO.getNotificationType(), notificationDTO.getTitle(),
                notificationDTO.getMessage(), notificationDTO.getCreatedAt(), UserMapper.mapToEntity(
                        notificationDTO.getUserDto(), UserMapper.mapToEntity(gardener, null)));
    }
}
