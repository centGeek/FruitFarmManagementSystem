package fruit.farm.management.mapper;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.entity.CoordinateEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CoordinateMapper")
class CoordinateMapperTest {

    @Test
    @DisplayName("mapToEntity copies coordinates and keeps the given sector")
    void mapToEntity_copiesCoordinatesAndSector() {
        CoordinateDto dto = new CoordinateDto(52.2297, 21.0122);

        CoordinateEntity entity = CoordinateMapper.mapToEntity(dto, null);

        assertThat(entity).isNotNull();
        assertThat(entity.getLatitude()).isEqualTo(52.2297);
        assertThat(entity.getLongitude()).isEqualTo(21.0122);
        assertThat(entity.getSector()).isNull();
    }

    @Test
    @DisplayName("mapToEntity returns null for a null DTO")
    void mapToEntity_whenDtoIsNull_returnsNull() {
        assertThat(CoordinateMapper.mapToEntity(null, null)).isNull();
    }

    @Test
    @DisplayName("mapFromEntity copies coordinates")
    void mapFromEntity_copiesCoordinates() {
        CoordinateEntity entity = new CoordinateEntity(50.0647, 19.9450, null);

        CoordinateDto dto = CoordinateMapper.mapFromEntity(entity);

        assertThat(dto).isNotNull();
        assertThat(dto.getLatitude()).isEqualTo(50.0647);
        assertThat(dto.getLongitude()).isEqualTo(19.9450);
    }

    @Test
    @DisplayName("mapFromEntity returns null for a null entity")
    void mapFromEntity_whenEntityIsNull_returnsNull() {
        assertThat(CoordinateMapper.mapFromEntity(null)).isNull();
    }

    @Test
    @DisplayName("mapToEntities maps the whole list preserving order")
    void mapToEntities_mapsWholeList() {
        List<CoordinateDto> dtos = List.of(
                new CoordinateDto(1.0, 2.0),
                new CoordinateDto(3.0, 4.0));

        List<CoordinateEntity> entities = CoordinateMapper.mapToEntities(dtos, null);

        assertThat(entities).hasSize(2);
        assertThat(entities).extracting(CoordinateEntity::getLatitude)
                .containsExactly(1.0, 3.0);
        assertThat(entities).extracting(CoordinateEntity::getLongitude)
                .containsExactly(2.0, 4.0);
    }

    @Test
    @DisplayName("mapFromEntities maps the whole list preserving order")
    void mapFromEntities_mapsWholeList() {
        List<CoordinateEntity> entities = List.of(
                new CoordinateEntity(1.0, 2.0, null),
                new CoordinateEntity(3.0, 4.0, null));

        List<CoordinateDto> dtos = CoordinateMapper.mapFromEntities(entities, null);

        assertThat(dtos).containsExactly(
                new CoordinateDto(1.0, 2.0),
                new CoordinateDto(3.0, 4.0));
    }
}
