package fruit.farm.management.mapper;

import fruit.farm.management.dto.WeatherNotificationDto;
import fruit.farm.management.entity.WeatherNotificationEntity;

public class WeatherNotificationMapper {

    public static WeatherNotificationDto mapToDto(WeatherNotificationEntity entity) {
        if (entity == null) {
            return null;
        }

        WeatherNotificationDto dto = new WeatherNotificationDto();
        dto.setId(entity.getId());
        dto.setWeatherNotificationType(entity.getWeatherNotificationType());
        dto.setThreshold(entity.getThreshold());
        dto.setDaysAhead(entity.getDaysAhead());
        dto.setEnabled(entity.getEnabled());
        dto.setDescription(generateDescription(entity));
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setLastTriggeredAt(entity.getLastTriggeredAt());

        return dto;
    }

    public static WeatherNotificationEntity mapToEntity(WeatherNotificationDto dto) {
        if (dto == null) {
            return null;
        }

        WeatherNotificationEntity entity = new WeatherNotificationEntity();
        entity.setId(dto.getId());
        entity.setWeatherNotificationType(dto.getWeatherNotificationType());
        entity.setThreshold(dto.getThreshold());
        entity.setDaysAhead(dto.getDaysAhead());
        entity.setEnabled(dto.getEnabled());
        entity.setLastTriggeredAt(dto.getLastTriggeredAt());

        return entity;
    }

    private static String generateDescription(WeatherNotificationEntity entity) {
        String days = entity.getDaysAhead() == 1 ? "1 dzień" : entity.getDaysAhead() + " dni";

        return switch (entity.getWeatherNotificationType()) {
            case FROST_WARNING -> String.format("Alert o przymrozku gdy temperatura spadnie poniżej %.1f°C w ciągu %s",
                    entity.getThreshold(), days);
            case TEMP_LOW -> String.format("Alert o niskiej temperaturze poniżej %.1f°C w ciągu %s",
                    entity.getThreshold(), days);
            case TEMP_HIGH -> String.format("Alert o wysokiej temperaturze powyżej %.1f°C w ciągu %s",
                    entity.getThreshold(), days);
            case RAIN_FORECAST -> String.format("Alert o opadach gdy prawdopodobieństwo przekroczy %.0f%% w ciągu %s",
                    entity.getThreshold(), days);
            case STRONG_WIND -> String.format("Alert o silnym wietrze powyżej %.0f km/h w ciągu %s",
                    entity.getThreshold(), days);
        };
    }
}