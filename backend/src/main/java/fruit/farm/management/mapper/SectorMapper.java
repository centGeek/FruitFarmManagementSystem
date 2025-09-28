package fruit.farm.management.mapper;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.SectorEntity;

public class SectorMapper {

    public static SectorEntity mapFromDTO(SectorDTO sectorDTO) {
        return new SectorEntity();
    }
}
