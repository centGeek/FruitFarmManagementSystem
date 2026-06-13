package fruit.farm.management.mapper;

import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.PlantType;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.entity.WorkType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("WorkEntryMapper")
class WorkEntryMapperTest {

    private UserEntity buildEmployee() {
        UserEntity user = new UserEntity();
        user.setId(42L);
        user.setName("Jan");
        user.setSurname("Kowalski");
        user.setNickname("jan");
        user.setPhoneNumber("123-456-789");
        user.setEmail("jan@orch.com");
        user.setCreationDate(LocalDate.of(2026, 1, 1));
        user.setActive(true);
        user.setLocalityName("Warsaw");
        // No credentials -> UserMapper returns the basic DTO.
        return user;
    }

    private SectorEntity buildSector() {
        SectorEntity sector = new SectorEntity();
        sector.setSectorId(7L);
        sector.setPlantType(PlantType.JABŁOŃ);
        sector.setVariety("GALA");
        sector.setDescription("Sektor jabłoni");
        sector.setCreatedAt(LocalDate.of(2025, 3, 15));
        sector.setIsActive(true);
        sector.setCoordinates(List.of(
                new CoordinateEntity(50.06, 19.94, null),
                new CoordinateEntity(50.07, 19.95, null),
                new CoordinateEntity(50.08, 19.96, null),
                new CoordinateEntity(50.09, 19.97, null)));
        return sector;
    }

    private WorkEntryEntity buildEntry(UserEntity user, SectorEntity sector) {
        WorkEntryEntity entity = new WorkEntryEntity();
        entity.setEntryId(100L);
        entity.setWorkDate(LocalDate.of(2026, 6, 10));
        entity.setDuration(8);
        entity.setWorkType(WorkType.HARVEST);
        entity.setDescription("Zbiór jabłek");
        entity.setCreatedAt(LocalDateTime.of(2026, 6, 10, 17, 30, 0));
        entity.setDaySalary(new BigDecimal("250.75"));
        entity.setKilogramsPicked(120L);
        entity.setIsPaid(true);
        entity.setUser(user);
        entity.setSector(sector);
        return entity;
    }

    @Test
    @DisplayName("mapToDto copies every scalar field, nests the user DTO and nests the sector DTO when both relations are present")
    void mapToDto_whenUserAndSectorPresent_mapsAllFieldsAndNestedObjects() {
        // Arrange
        UserEntity user = buildEmployee();
        SectorEntity sector = buildSector();
        WorkEntryEntity entity = buildEntry(user, sector);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert - scalar fields
        assertThat(dto.getEntryId()).isEqualTo(100L);
        assertThat(dto.getWorkDate()).isEqualTo(LocalDate.of(2026, 6, 10));
        assertThat(dto.getDuration()).isEqualTo(8);
        assertThat(dto.getWorkType()).isEqualTo(WorkType.HARVEST);
        assertThat(dto.getDescription()).isEqualTo("Zbiór jabłek");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 10, 17, 30, 0));
        assertThat(dto.getDaySalary()).isEqualByComparingTo("250.75");
        assertThat(dto.getKilogramsPicked()).isEqualTo(120L);
        assertThat(dto.getIsPaid()).isTrue();

        // Assert - nested user DTO
        assertThat(dto.getUser()).isNotNull();
        assertThat(dto.getUser().getId()).isEqualTo(42L);
        assertThat(dto.getUser().getNickname()).isEqualTo("jan");
        assertThat(dto.getUser().getEmail()).isEqualTo("jan@orch.com");
        assertThat(dto.getUser().getLocalityName()).isEqualTo("Warsaw");

        // Assert - nested sector DTO
        assertThat(dto.getSector()).isNotNull();
        assertThat(dto.getSector().getId()).isEqualTo(7L);
        assertThat(dto.getSector().getPlantType()).isEqualTo(PlantType.JABŁOŃ);
        assertThat(dto.getSector().getVariety()).isEqualTo("GALA");
        assertThat(dto.getSector().getDescription()).isEqualTo("Sektor jabłoni");
        assertThat(dto.getSector().getCreatedAt()).isEqualTo(LocalDate.of(2025, 3, 15));
        assertThat(dto.getSector().getIsActive()).isTrue();
        assertThat(dto.getSector().getCoordinates()).hasSize(4);
        assertThat(dto.getSector().getCoordinates().get(0).getLatitude()).isEqualTo(50.06);
        assertThat(dto.getSector().getCoordinates().get(0).getLongitude()).isEqualTo(19.94);
    }

    @Test
    @DisplayName("mapToDto leaves the user DTO null when the entity has no user")
    void mapToDto_whenUserNull_leavesUserDtoNull() {
        // Arrange
        WorkEntryEntity entity = buildEntry(null, buildSector());

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getUser()).isNull();
        assertThat(dto.getSector()).isNotNull();
        assertThat(dto.getEntryId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("mapToDto leaves the sector DTO null when the entity has no sector")
    void mapToDto_whenSectorNull_leavesSectorDtoNull() {
        // Arrange
        WorkEntryEntity entity = buildEntry(buildEmployee(), null);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getSector()).isNull();
        assertThat(dto.getUser()).isNotNull();
        assertThat(dto.getUser().getId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("mapToDto leaves both nested DTOs null when neither relation is present")
    void mapToDto_whenUserAndSectorNull_leavesBothNestedDtosNull() {
        // Arrange
        WorkEntryEntity entity = buildEntry(null, null);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getUser()).isNull();
        assertThat(dto.getSector()).isNull();
        assertThat(dto.getWorkType()).isEqualTo(WorkType.HARVEST);
        assertThat(dto.getDaySalary()).isEqualByComparingTo("250.75");
    }

    @Test
    @DisplayName("mapToDto defaults the sector active flag to true when the source sector flag is null")
    void mapToDto_whenSectorActiveFlagNull_defaultsToTrue() {
        // Arrange
        SectorEntity sector = buildSector();
        sector.setIsActive(null);
        WorkEntryEntity entity = buildEntry(buildEmployee(), sector);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getSector()).isNotNull();
        assertThat(dto.getSector().getIsActive()).isTrue();
    }

    @Test
    @DisplayName("mapToDto preserves a false isPaid flag and zero boundary scalar values")
    void mapToDto_whenUnpaidWithZeroValues_preservesBoundaryValues() {
        // Arrange
        WorkEntryEntity entity = buildEntry(buildEmployee(), buildSector());
        entity.setIsPaid(false);
        entity.setDuration(0);
        entity.setKilogramsPicked(0L);
        entity.setDaySalary(BigDecimal.ZERO);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getIsPaid()).isFalse();
        assertThat(dto.getDuration()).isZero();
        assertThat(dto.getKilogramsPicked()).isZero();
        assertThat(dto.getDaySalary()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("mapToDto passes through a null isPaid flag without substituting a default")
    void mapToDto_whenIsPaidNull_keepsItNull() {
        // Arrange
        WorkEntryEntity entity = buildEntry(buildEmployee(), buildSector());
        entity.setIsPaid(null);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getIsPaid()).isNull();
    }

    @ParameterizedTest
    @EnumSource(WorkType.class)
    @DisplayName("mapToDto carries every WorkType value through unchanged")
    void mapToDto_forEachWorkType_carriesItThrough(WorkType workType) {
        // Arrange
        WorkEntryEntity entity = buildEntry(buildEmployee(), buildSector());
        entity.setWorkType(workType);

        // Act
        WorkEntryDto dto = WorkEntryMapper.mapToDto(entity);

        // Assert
        assertThat(dto.getWorkType()).isEqualTo(workType);
    }
}
