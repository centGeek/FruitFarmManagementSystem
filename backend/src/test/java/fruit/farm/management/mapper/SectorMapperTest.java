package fruit.farm.management.mapper;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.SectorDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.PlantType;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SectorMapper")
class SectorMapperTest {

    private UserDto ownerDto(long id) {
        UserDto owner = new UserDto();
        owner.setId(id);
        owner.setName("Jan");
        owner.setSurname("Kowalski");
        owner.setNickname("gardener");
        owner.setPhoneNumber("111-222-333");
        owner.setEmail("gardener@orch.com");
        owner.setActive(true);
        owner.setLocalityName("Warsaw");
        return owner;
    }

    private List<CoordinateDto> squareCoordinates() {
        return List.of(
                new CoordinateDto(50.0, 19.9),
                new CoordinateDto(50.0, 20.0),
                new CoordinateDto(50.1, 20.0),
                new CoordinateDto(50.1, 19.9));
    }

    private SectorEntity squareCoordinateEntities() {
        SectorEntity sector = new SectorEntity();
        sector.setCoordinates(List.of(
                new CoordinateEntity(50.0, 19.9, null),
                new CoordinateEntity(50.0, 20.0, null),
                new CoordinateEntity(50.1, 20.0, null),
                new CoordinateEntity(50.1, 19.9, null)));
        return sector;
    }

    @Test
    @DisplayName("mapFromDTO copies scalar fields, maps every coordinate and maps the owner as an Employee")
    void mapFromDTO_withFullDto_copiesFieldsCoordinatesAndOwner() {
        // Arrange
        SectorDto dto = new SectorDto(42L, "Northern apple plot", PlantType.JABŁOŃ, "GALA",
                squareCoordinates(), LocalDate.of(2026, 4, 1), true);
        UserDto owner = ownerDto(7L);

        // Act
        SectorEntity entity = SectorMapper.mapFromDTO(dto, owner);

        // Assert
        assertThat(entity.getSectorId()).isEqualTo(42L);
        assertThat(entity.getPlantType()).isEqualTo(PlantType.JABŁOŃ);
        assertThat(entity.getVariety()).isEqualTo("GALA");
        assertThat(entity.getDescription()).isEqualTo("Northern apple plot");
        assertThat(entity.getCreatedAt()).isEqualTo(LocalDate.of(2026, 4, 1));
        assertThat(entity.getIsActive()).isTrue();
        assertThat(entity.getCoordinates()).hasSize(4);
        assertThat(entity.getCoordinates())
                .extracting(CoordinateEntity::getLatitude)
                .containsExactly(50.0, 50.0, 50.1, 50.1);
        assertThat(entity.getCoordinates())
                .extracting(CoordinateEntity::getLongitude)
                .containsExactly(19.9, 20.0, 20.0, 19.9);
        assertThat(entity.getUserEntity()).isNotNull();
        assertThat(entity.getUserEntity().getId()).isEqualTo(7L);
        assertThat(entity.getUserEntity().getRole().getRoleName())
                .isEqualTo(RoleType.EMPLOYEE.getDisplayName());
    }

    @Test
    @DisplayName("mapFromDTO produces an empty coordinate list when the DTO has no coordinates")
    void mapFromDTO_withEmptyCoordinates_producesEmptyCoordinateList() {
        // Arrange
        SectorDto dto = new SectorDto(1L, "Empty plot", PlantType.GRUSZA, "KONFERENCJA",
                List.of(), LocalDate.of(2026, 1, 15), false);
        UserDto owner = ownerDto(3L);

        // Act
        SectorEntity entity = SectorMapper.mapFromDTO(dto, owner);

        // Assert
        assertThat(entity.getCoordinates()).isEmpty();
        assertThat(entity.getIsActive()).isFalse();
        assertThat(entity.getUserEntity().getId()).isEqualTo(3L);
    }

    @Test
    @DisplayName("mapToDTO copies scalar fields, maps every coordinate and keeps an explicit active flag")
    void mapToDTO_withFullEntity_copiesFieldsCoordinatesAndActiveFlag() {
        // Arrange
        SectorEntity entity = squareCoordinateEntities();
        entity.setSectorId(99L);
        entity.setPlantType(PlantType.WIŚNIA);
        entity.setVariety("KORDIA");
        entity.setDescription("Cherry plot");
        entity.setCreatedAt(LocalDate.of(2026, 3, 20));
        entity.setIsActive(true);

        // Act
        SectorDto dto = SectorMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(99L);
        assertThat(dto.getPlantType()).isEqualTo(PlantType.WIŚNIA);
        assertThat(dto.getVariety()).isEqualTo("KORDIA");
        assertThat(dto.getDescription()).isEqualTo("Cherry plot");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDate.of(2026, 3, 20));
        assertThat(dto.getIsActive()).isTrue();
        assertThat(dto.getCoordinates()).hasSize(4);
        assertThat(dto.getCoordinates())
                .extracting(CoordinateDto::getLatitude)
                .containsExactly(50.0, 50.0, 50.1, 50.1);
        assertThat(dto.getCoordinates())
                .extracting(CoordinateDto::getLongitude)
                .containsExactly(19.9, 20.0, 20.0, 19.9);
    }

    @Test
    @DisplayName("mapToDTO defaults isActive to true on both DTO and entity when the entity flag is null")
    void mapToDTO_whenIsActiveNull_defaultsToTrueAndMutatesEntity() {
        // Arrange
        SectorEntity entity = squareCoordinateEntities();
        entity.setSectorId(5L);
        entity.setPlantType(PlantType.MALINA);
        entity.setVariety("POLKA");
        entity.setDescription("Raspberry plot");
        entity.setCreatedAt(LocalDate.of(2026, 6, 1));
        entity.setIsActive(null);

        // Act
        SectorDto dto = SectorMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getIsActive()).isTrue();
        // The mapper guards a null flag by mutating the source entity in place.
        assertThat(entity.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("mapToDTO produces an empty coordinate list when the entity has no coordinates")
    void mapToDTO_withEmptyCoordinates_producesEmptyCoordinateList() {
        // Arrange
        SectorEntity entity = new SectorEntity();
        entity.setSectorId(8L);
        entity.setPlantType(PlantType.ARONIA);
        entity.setVariety("NERO");
        entity.setDescription("Aronia plot");
        entity.setCreatedAt(LocalDate.of(2026, 2, 2));
        entity.setIsActive(false);
        entity.setCoordinates(List.of());

        // Act
        SectorDto dto = SectorMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getCoordinates()).isEmpty();
        assertThat(dto.getIsActive()).isFalse();
        assertThat(dto.getId()).isEqualTo(8L);
    }

    @Test
    @DisplayName("mapFromDTO then mapToDTO round-trips the scalar fields and coordinates")
    void mapFromDTO_thenMapToDTO_roundTripsScalarsAndCoordinates() {
        // Arrange
        SectorDto original = new SectorDto(15L, "Plum plot", PlantType.ŚLIWA, "STANLEY",
                squareCoordinates(), LocalDate.of(2026, 5, 5), true);
        UserDto owner = ownerDto(2L);

        // Act
        SectorEntity entity = SectorMapper.mapFromDTO(original, owner);
        SectorDto roundTripped = SectorMapper.mapToDTO(entity);

        // Assert
        assertThat(roundTripped.getId()).isEqualTo(original.getId());
        assertThat(roundTripped.getDescription()).isEqualTo(original.getDescription());
        assertThat(roundTripped.getPlantType()).isEqualTo(original.getPlantType());
        assertThat(roundTripped.getVariety()).isEqualTo(original.getVariety());
        assertThat(roundTripped.getCreatedAt()).isEqualTo(original.getCreatedAt());
        assertThat(roundTripped.getIsActive()).isEqualTo(original.getIsActive());
        assertThat(roundTripped.getCoordinates()).containsExactlyElementsOf(original.getCoordinates());
    }
}
