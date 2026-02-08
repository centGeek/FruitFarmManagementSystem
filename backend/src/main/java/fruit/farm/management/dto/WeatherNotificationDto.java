package fruit.farm.management.dto;

import fruit.farm.management.entity.WeatherNotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherNotificationDto {

    private Long id;

    private WeatherNotificationType weatherNotificationType;

    private Double threshold;

    private Integer daysAhead;

    private Boolean enabled;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime lastTriggeredAt;
}