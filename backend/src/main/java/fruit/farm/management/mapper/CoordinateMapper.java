package fruit.farm.management.mapper;

import fruit.farm.management.dto.CoordinateDTO;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.SectorEntity;

import java.util.ArrayList;
import java.util.List;

public class CoordinateMapper {

    public static CoordinateEntity mapToEntity(CoordinateDTO coordinateDTO, SectorEntity sectorEntity) {

        return new CoordinateEntity(coordinateDTO.getLatitude(), coordinateDTO.getLongitude(), sectorEntity);
    }

    public static List<CoordinateEntity> mapToEntities(List<CoordinateDTO> coordinateDTOS, SectorEntity sectorEntity) {

        List<CoordinateEntity> coordinateEntities = new ArrayList<>();
        for (CoordinateDTO coordinateDTO : coordinateDTOS) {
           coordinateEntities.add(mapToEntity(coordinateDTO, sectorEntity));
        }
        return coordinateEntities;
    }
}
