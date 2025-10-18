package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherAlertDTO {
    private Long id;
    private String alertType;
    private String severity;
    private String message;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isActive;
    private String recommendation;
}