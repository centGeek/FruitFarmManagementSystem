package fruit.farm.management.mapper;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.SectorEntity;

import java.util.ArrayList;
import java.util.List;

public class CoordinateMapper {

    public static CoordinateEntity mapToEntity(CoordinateDto coordinateDTO, SectorEntity sectorEntity) {

        if (coordinateDTO == null) {
            return null;
        }
        return new CoordinateEntity(coordinateDTO.getLatitude(), coordinateDTO.getLongitude(), sectorEntity);
    }

    public static CoordinateDto mapFromEntity(CoordinateEntity coordinateEntity) {

        if (coordinateEntity == null) {
            return null;
        }
        return new CoordinateDto(coordinateEntity.getLatitude(), coordinateEntity.getLongitude());
    }

    public static List<CoordinateEntity> mapToEntities(List<CoordinateDto> coordinateDtos, SectorEntity sectorEntity) {

        List<CoordinateEntity> coordinateEntities = new ArrayList<>();
        for (CoordinateDto coordinateDTO : coordinateDtos) {
           coordinateEntities.add(mapToEntity(coordinateDTO, sectorEntity));
        }
        return coordinateEntities;
    }

    public static List<CoordinateDto> mapFromEntities(List<CoordinateEntity> coordinateEntities, SectorEntity sectorEntity) {

        List<CoordinateDto> coordinateDtos = new ArrayList<>();
        for (CoordinateEntity coordinateEntity : coordinateEntities) {
           coordinateDtos.add(mapFromEntity(coordinateEntity));
        }
        return coordinateDtos;
    }
}
