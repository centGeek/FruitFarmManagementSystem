package fruit.farm.management.mapper;

import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkDetailsEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("WorkDetailsMapper")
class WorkDetailsMapperTest {

    private UserEntity employee(long id, String nickname) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("Jan");
        user.setSurname("Kowalski");
        user.setNickname(nickname);
        user.setPhoneNumber("555-444-333");
        user.setEmail(nickname + "@orch.com");
        user.setCreationDate(LocalDate.of(2026, 1, 1));
        user.setActive(true);
        user.setLocalityName("Warsaw");
        // No credentials set -> UserMapper.mapFromEntity returns a basic DTO.
        return user;
    }

    private WorkDetailsEntity hourlyWorkDetails(UserEntity owner) {
        WorkDetailsEntity entity = new WorkDetailsEntity();
        entity.setId(42L);
        entity.setIsPaidHourly(true);
        entity.setHourlyPay(new BigDecimal("25.50"));
        entity.setPayPerKilogram(new BigDecimal("3.75"));
        entity.setCreatedAt(LocalDateTime.of(2026, 6, 13, 8, 30, 0));
        entity.setUserEntity(owner);
        return entity;
    }

    @Test
    @DisplayName("mapFromEntity copies every scalar field and nests the user DTO")
    void mapFromEntity_withFullEntity_copiesAllFieldsAndNestsUser() {
        // Arrange
        UserEntity owner = employee(7L, "employee");
        WorkDetailsEntity entity = hourlyWorkDetails(owner);

        // Act
        WorkDetailsDto dto = WorkDetailsMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getIsPaidHourly()).isTrue();
        assertThat(dto.getHourlyPay()).isEqualByComparingTo("25.50");
        assertThat(dto.getPayPerKilogram()).isEqualByComparingTo("3.75");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 13, 8, 30, 0));
        assertThat(dto.getUserDTO()).isNotNull();
        assertThat(dto.getUserDTO().getId()).isEqualTo(7L);
        assertThat(dto.getUserDTO().getName()).isEqualTo("Jan");
        assertThat(dto.getUserDTO().getSurname()).isEqualTo("Kowalski");
        assertThat(dto.getUserDTO().getNickname()).isEqualTo("employee");
        assertThat(dto.getUserDTO().getPhoneNumber()).isEqualTo("555-444-333");
        assertThat(dto.getUserDTO().getEmail()).isEqualTo("employee@orch.com");
        assertThat(dto.getUserDTO().getLocalityName()).isEqualTo("Warsaw");
        // No credentials on the entity, so UserMapper takes the basic-DTO branch (no nested gardener).
        assertThat(dto.getUserDTO().getGardener()).isNull();
    }

    @Test
    @DisplayName("mapFromEntity maps a per-kilogram (not hourly) configuration without losing the flag")
    void mapFromEntity_whenPaidPerKilogram_preservesFalseHourlyFlag() {
        // Arrange
        UserEntity owner = employee(8L, "picker");
        WorkDetailsEntity entity = hourlyWorkDetails(owner);
        entity.setIsPaidHourly(false);

        // Act
        WorkDetailsDto dto = WorkDetailsMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getIsPaidHourly()).isFalse();
        assertThat(dto.getPayPerKilogram()).isEqualByComparingTo("3.75");
        // The other scalar fields are still copied verbatim regardless of the pay mode.
        assertThat(dto.getHourlyPay()).isEqualByComparingTo("25.50");
        assertThat(dto.getUserDTO().getId()).isEqualTo(8L);
        assertThat(dto.getUserDTO().getNickname()).isEqualTo("picker");
    }

    @Test
    @DisplayName("mapToDTO copies every scalar field and nests the user DTO")
    void mapToDTO_withFullEntity_copiesAllFieldsAndNestsUser() {
        // Arrange
        UserEntity owner = employee(9L, "worker");
        WorkDetailsEntity entity = hourlyWorkDetails(owner);

        // Act
        WorkDetailsDto dto = WorkDetailsMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getIsPaidHourly()).isTrue();
        assertThat(dto.getHourlyPay()).isEqualByComparingTo("25.50");
        assertThat(dto.getPayPerKilogram()).isEqualByComparingTo("3.75");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 13, 8, 30, 0));
        assertThat(dto.getUserDTO()).isNotNull();
        assertThat(dto.getUserDTO().getId()).isEqualTo(9L);
        assertThat(dto.getUserDTO().getNickname()).isEqualTo("worker");
        assertThat(dto.getUserDTO().getEmail()).isEqualTo("worker@orch.com");
    }

    @Test
    @DisplayName("mapFromEntity and mapToDTO produce equivalent DTOs from the same entity")
    void mapFromEntityAndMapToDTO_fromSameEntity_produceEquivalentDtos() {
        // Arrange
        UserEntity owner = employee(10L, "equal");
        WorkDetailsEntity entity = hourlyWorkDetails(owner);

        // Act
        WorkDetailsDto fromEntity = WorkDetailsMapper.mapFromEntity(entity);
        WorkDetailsDto toDto = WorkDetailsMapper.mapToDTO(entity);

        // Assert
        assertThat(toDto.getId()).isEqualTo(fromEntity.getId());
        assertThat(toDto.getIsPaidHourly()).isEqualTo(fromEntity.getIsPaidHourly());
        assertThat(toDto.getHourlyPay()).isEqualByComparingTo(fromEntity.getHourlyPay());
        assertThat(toDto.getPayPerKilogram()).isEqualByComparingTo(fromEntity.getPayPerKilogram());
        assertThat(toDto.getCreatedAt()).isEqualTo(fromEntity.getCreatedAt());
        assertThat(toDto.getUserDTO()).isNotNull();
        assertThat(toDto.getUserDTO().getId()).isEqualTo(fromEntity.getUserDTO().getId());
        assertThat(toDto.getUserDTO().getNickname()).isEqualTo(fromEntity.getUserDTO().getNickname());
        assertThat(toDto.getUserDTO().getEmail()).isEqualTo(fromEntity.getUserDTO().getEmail());
    }
}
