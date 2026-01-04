package fruit.farm.management.mapper;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.entity.SectorEntity;

import java.time.LocalDate;

public class SectorMapper {

    public static SectorEntity mapFromDTO(SectorDTO sectorDTO, UserDTO userDTO) {
        return new SectorEntity(sectorDTO.getId(), sectorDTO.getPlantType(), sectorDTO.getVariety(), sectorDTO.getDescription(),
                sectorDTO.getCreatedAt(), sectorDTO.getIsActive(), CoordinateMapper.mapToEntities(sectorDTO.getCoordinates(), null),
                UserMapper.mapToEntity(userDTO, null));
    }
    public static SectorDTO mapToDTO(SectorEntity sectorEntity) {
        if(sectorEntity.getIsActive() == null) {
            sectorEntity.setIsActive(true);
        }
        return new SectorDTO(sectorEntity.getSectorId(), sectorEntity.getDescription(), sectorEntity.getPlantType(),
                sectorEntity.getVariety(), CoordinateMapper.mapFromEntities(sectorEntity.getCoordinates(),
                null), sectorEntity.getCreatedAt(), sectorEntity.getIsActive());
    }
}
