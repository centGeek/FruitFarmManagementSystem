package fruit.farm.management.mapper;

import fruit.farm.management.dto.WeatherNotificationDto;
import fruit.farm.management.entity.WeatherNotificationEntity;
import fruit.farm.management.entity.WeatherNotificationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("WeatherNotificationMapper")
class WeatherNotificationMapperTest {

    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 1, 1, 8, 0);
    private static final LocalDateTime UPDATED_AT = LocalDateTime.of(2026, 2, 2, 9, 30);
    private static final LocalDateTime LAST_TRIGGERED_AT = LocalDateTime.of(2026, 3, 3, 10, 45);

    private WeatherNotificationEntity fullEntity() {
        WeatherNotificationEntity entity = new WeatherNotificationEntity();
        entity.setId(42L);
        entity.setWeatherNotificationType(WeatherNotificationType.FROST_WARNING);
        entity.setThreshold(-2.5);
        entity.setDaysAhead(3);
        entity.setEnabled(true);
        entity.setCreatedAt(CREATED_AT);
        entity.setUpdatedAt(UPDATED_AT);
        entity.setLastTriggeredAt(LAST_TRIGGERED_AT);
        return entity;
    }

    @Test
    @DisplayName("mapToDto copies every field and generates the description from the entity")
    void mapToDto_withFullEntity_copiesAllFieldsAndGeneratesDescription() {
        // Arrange
        WeatherNotificationEntity entity = fullEntity();

        // Act
        WeatherNotificationDto dto = WeatherNotificationMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getWeatherNotificationType()).isEqualTo(WeatherNotificationType.FROST_WARNING);
        assertThat(dto.getThreshold()).isEqualTo(-2.5);
        assertThat(dto.getDaysAhead()).isEqualTo(3);
        assertThat(dto.getEnabled()).isTrue();
        assertThat(dto.getCreatedAt()).isEqualTo(CREATED_AT);
        assertThat(dto.getUpdatedAt()).isEqualTo(UPDATED_AT);
        assertThat(dto.getLastTriggeredAt()).isEqualTo(LAST_TRIGGERED_AT);
        // Description is derived (not a copy of any single entity field).
        assertThat(dto.getDescription())
                .startsWith("Alert o przymrozku gdy temperatura spadnie poniżej")
                .endsWith("w ciągu 3 dni");
    }

    @Test
    @DisplayName("mapToDto returns null when the entity is null")
    void mapToDto_whenEntityNull_returnsNull() {
        // Act
        WeatherNotificationDto dto = WeatherNotificationMapper.mapToDto(null);

        // Assert
        assertThat(dto).isNull();
    }

    @Test
    @DisplayName("mapToDto pluralizes the day suffix to '1 dzień' when daysAhead equals one")
    void mapToDto_whenOneDayAhead_usesSingularDaySuffix() {
        // Arrange
        WeatherNotificationEntity entity = fullEntity();
        entity.setDaysAhead(1);

        // Act
        WeatherNotificationDto dto = WeatherNotificationMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getDescription())
                .endsWith("w ciągu 1 dzień")
                .doesNotContain("w ciągu 1 dni");
    }

    @ParameterizedTest(name = "{0} description starts with \"{1}\"")
    @CsvSource({
            "FROST_WARNING, 'Alert o przymrozku gdy temperatura spadnie poniżej'",
            "TEMP_LOW,      'Alert o niskiej temperaturze poniżej'",
            "TEMP_HIGH,     'Alert o wysokiej temperaturze powyżej'",
            "RAIN_FORECAST, 'Alert o opadach gdy prawdopodobieństwo przekroczy'",
            "STRONG_WIND,   'Alert o silnym wietrze powyżej'"
    })
    @DisplayName("mapToDto generates a type-specific Polish description for every notification type")
    void mapToDto_perType_generatesTypeSpecificDescription(WeatherNotificationType type, String expectedPrefix) {
        // Arrange
        WeatherNotificationEntity entity = fullEntity();
        entity.setWeatherNotificationType(type);
        entity.setThreshold(80.0);
        entity.setDaysAhead(5);

        // Act
        WeatherNotificationDto dto = WeatherNotificationMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getDescription())
                .startsWith(expectedPrefix)
                .endsWith("w ciągu 5 dni");
    }

    @Test
    @DisplayName("mapToEntity copies the persisted fields and ignores the derived/audit-managed ones")
    void mapToEntity_withFullDto_copiesPersistedFieldsAndIgnoresDerivedFields() {
        // Arrange
        WeatherNotificationDto dto = new WeatherNotificationDto(
                7L,
                WeatherNotificationType.STRONG_WIND,
                65.0,
                2,
                false,
                "this description must be ignored",
                CREATED_AT,
                UPDATED_AT,
                LAST_TRIGGERED_AT);

        // Act
        WeatherNotificationEntity entity = WeatherNotificationMapper.mapToEntity(dto);

        // Assert
        assertThat(entity.getId()).isEqualTo(7L);
        assertThat(entity.getWeatherNotificationType()).isEqualTo(WeatherNotificationType.STRONG_WIND);
        assertThat(entity.getThreshold()).isEqualTo(65.0);
        assertThat(entity.getDaysAhead()).isEqualTo(2);
        assertThat(entity.getEnabled()).isFalse();
        assertThat(entity.getLastTriggeredAt()).isEqualTo(LAST_TRIGGERED_AT);
        // Audit columns are managed by the persistence layer, not the mapper.
        assertThat(entity.getCreatedAt()).isNull();
        assertThat(entity.getUpdatedAt()).isNull();
        // No relation is set by the mapper.
        assertThat(entity.getUser()).isNull();
    }

    @Test
    @DisplayName("mapToEntity returns null when the DTO is null")
    void mapToEntity_whenDtoNull_returnsNull() {
        // Act
        WeatherNotificationEntity entity = WeatherNotificationMapper.mapToEntity(null);

        // Assert
        assertThat(entity).isNull();
    }
}
