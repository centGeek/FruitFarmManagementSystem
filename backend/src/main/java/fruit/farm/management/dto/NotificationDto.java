package fruit.farm.management.dto;

import fruit.farm.management.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@AllArgsConstructor
@Data
@Builder
public class NotificationDto {

    private Long id;

    private NotificationType notificationType;

    private String title;

    private String message;

    private LocalDateTime createdAt;

    private UserDto userDto;
}
