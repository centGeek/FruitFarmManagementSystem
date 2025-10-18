package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeatherDataDTO {
    private Long id;
    private LocalDateTime timestamp;
    private Double temperature;
    private Double feelsLike;
    private Integer humidity;
    private Double windSpeed;
    private Integer windDegree;
    private Double precipitation;
    private Double pressure;
    private String description;
    private String iconCode;
    private Integer cloudiness;
    private Double visibility;
}