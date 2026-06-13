package fruit.farm.management.mapper;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.NotificationType;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("NotificationMapper")
class NotificationMapperTest {

    private UserEntity userEntity(long id, String nickname) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("John");
        user.setSurname("Doe");
        user.setNickname(nickname);
        user.setPhoneNumber("111-222-333");
        user.setEmail(nickname + "@orch.com");
        user.setCreationDate(LocalDate.of(2026, 1, 1));
        user.setActive(true);
        user.setLocalityName("Warsaw");
        return user;
    }

    private UserDto userDto(long id, String nickname) {
        UserDto dto = new UserDto();
        dto.setId(id);
        dto.setName("Anna");
        dto.setSurname("Nowak");
        dto.setNickname(nickname);
        dto.setPhoneNumber("999");
        dto.setEmail(nickname + "@orch.com");
        dto.setCreationDate(LocalDate.of(2026, 2, 2));
        dto.setActive(true);
        dto.setLocalityName("Krakow");
        dto.setCoordinateDTO(new CoordinateDto(50.0, 19.9));
        return dto;
    }

    @Test
    @DisplayName("mapFromEntity copies every scalar field and nests the owner DTO")
    void mapFromEntity_copiesScalarFieldsAndNestsOwnerDto() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.of(2026, 6, 13, 9, 30, 0);
        NotificationEntity entity = new NotificationEntity(
                42L,
                NotificationType.EXPENSE,
                "Nowy wydatek",
                "Dodano nowy wydatek na paliwo",
                createdAt,
                userEntity(7L, "owner"));

        // Act
        NotificationDto dto = NotificationMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getNotificationType()).isEqualTo(NotificationType.EXPENSE);
        assertThat(dto.getTitle()).isEqualTo("Nowy wydatek");
        assertThat(dto.getMessage()).isEqualTo("Dodano nowy wydatek na paliwo");
        assertThat(dto.getCreatedAt()).isEqualTo(createdAt);
        assertThat(dto.getUserDto()).isNotNull();
        assertThat(dto.getUserDto().getId()).isEqualTo(7L);
        assertThat(dto.getUserDto().getNickname()).isEqualTo("owner");
        assertThat(dto.getUserDto().getEmail()).isEqualTo("owner@orch.com");
        assertThat(dto.getUserDto().getLocalityName()).isEqualTo("Warsaw");
    }

    @ParameterizedTest
    @EnumSource(NotificationType.class)
    @DisplayName("mapFromEntity preserves every NotificationType value")
    void mapFromEntity_preservesEveryNotificationType(NotificationType type) {
        // Arrange
        NotificationEntity entity = new NotificationEntity(
                1L, type, "Tytuł", "Wiadomość",
                LocalDateTime.of(2026, 6, 13, 12, 0), userEntity(3L, "user"));

        // Act
        NotificationDto dto = NotificationMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getNotificationType()).isEqualTo(type);
    }

    @Test
    @DisplayName("mapToEntity copies every scalar field and maps the owner via the nested user DTO")
    void mapToEntity_copiesScalarFieldsAndMapsOwner() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 1, 8, 15, 0);
        UserDto gardener = userDto(1L, "gardener");
        NotificationDto dto = NotificationDto.builder()
                .id(99L)
                .notificationType(NotificationType.ALERT)
                .title("Ostrzeżenie pogodowe")
                .message("Spodziewane przymrozki")
                .createdAt(createdAt)
                .userDto(userDto(5L, "employee"))
                .build();

        // Act
        NotificationEntity entity = NotificationMapper.mapToEntity(dto, gardener);

        // Assert
        assertThat(entity.getId()).isEqualTo(99L);
        assertThat(entity.getNotificationType()).isEqualTo(NotificationType.ALERT);
        assertThat(entity.getTitle()).isEqualTo("Ostrzeżenie pogodowe");
        assertThat(entity.getMessage()).isEqualTo("Spodziewane przymrozki");
        assertThat(entity.getCreatedAt()).isEqualTo(createdAt);
        assertThat(entity.getUserEntity()).isNotNull();
        assertThat(entity.getUserEntity().getId()).isEqualTo(5L);
        assertThat(entity.getUserEntity().getNickname()).isEqualTo("employee");
        assertThat(entity.getUserEntity().getEmail()).isEqualTo("employee@orch.com");
        assertThat(entity.getUserEntity().getLocalityName()).isEqualTo("Krakow");
    }

    @Test
    @DisplayName("mapToEntity nests the gardener entity (with the Employee role) under the mapped user")
    void mapToEntity_nestsGardenerEntityUnderUser() {
        // Arrange
        UserDto gardener = userDto(1L, "gardener");
        NotificationDto dto = NotificationDto.builder()
                .id(2L)
                .notificationType(NotificationType.USER)
                .title("Nowy pracownik")
                .message("Dodano pracownika do gospodarstwa")
                .createdAt(LocalDateTime.of(2026, 3, 3, 10, 0))
                .userDto(userDto(5L, "employee"))
                .build();

        // Act
        NotificationEntity entity = NotificationMapper.mapToEntity(dto, gardener);

        // Assert
        UserEntity mappedUser = entity.getUserEntity();
        assertThat(mappedUser.getRole().getRoleName()).isEqualTo(RoleType.EMPLOYEE.getDisplayName());
        assertThat(mappedUser.getGardener()).isNotNull();
        assertThat(mappedUser.getGardener().getId()).isEqualTo(1L);
        assertThat(mappedUser.getGardener().getNickname()).isEqualTo("gardener");
        assertThat(mappedUser.getGardener().getRole().getRoleName())
                .isEqualTo(RoleType.EMPLOYEE.getDisplayName());
        // The gardener entity is the leaf of the chain, so it has no further owner.
        assertThat(mappedUser.getGardener().getGardener()).isNull();
    }

    @Test
    @DisplayName("mapToEntity then mapFromEntity round-trips the scalar fields")
    void mapToEntity_thenMapFromEntity_roundTripsScalarFields() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.of(2026, 4, 20, 14, 45, 0);
        UserDto gardener = userDto(1L, "gardener");
        NotificationDto original = NotificationDto.builder()
                .id(123L)
                .notificationType(NotificationType.PROFIT)
                .title("Nowy zysk")
                .message("Zarejestrowano sprzedaż jabłek")
                .createdAt(createdAt)
                .userDto(userDto(8L, "owner"))
                .build();

        // Act
        NotificationEntity entity = NotificationMapper.mapToEntity(original, gardener);
        NotificationDto roundTripped = NotificationMapper.mapFromEntity(entity);

        // Assert
        assertThat(roundTripped.getId()).isEqualTo(123L);
        assertThat(roundTripped.getNotificationType()).isEqualTo(NotificationType.PROFIT);
        assertThat(roundTripped.getTitle()).isEqualTo("Nowy zysk");
        assertThat(roundTripped.getMessage()).isEqualTo("Zarejestrowano sprzedaż jabłek");
        assertThat(roundTripped.getCreatedAt()).isEqualTo(createdAt);
        assertThat(roundTripped.getUserDto()).isNotNull();
        assertThat(roundTripped.getUserDto().getId()).isEqualTo(8L);
        assertThat(roundTripped.getUserDto().getNickname()).isEqualTo("owner");
    }
}
