package fruit.farm.management.mapper;

import fruit.farm.management.dto.SectorDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.SectorEntity;

public class SectorMapper {

    public static SectorEntity mapFromDTO(SectorDto sectorDTO, UserDto userDTO) {
        return new SectorEntity(sectorDTO.getId(), sectorDTO.getPlantType(), sectorDTO.getVariety(), sectorDTO.getDescription(),
                sectorDTO.getCreatedAt(), sectorDTO.getIsActive(), CoordinateMapper.mapToEntities(sectorDTO.getCoordinates(), null),
                UserMapper.mapToEntity(userDTO, null));
    }
    public static SectorDto mapToDTO(SectorEntity sectorEntity) {
        if(sectorEntity.getIsActive() == null) {
            sectorEntity.setIsActive(true);
        }
        return new SectorDto(sectorEntity.getSectorId(), sectorEntity.getDescription(), sectorEntity.getPlantType(),
                sectorEntity.getVariety(), CoordinateMapper.mapFromEntities(sectorEntity.getCoordinates(),
                null), sectorEntity.getCreatedAt(), sectorEntity.getIsActive());
    }
}
