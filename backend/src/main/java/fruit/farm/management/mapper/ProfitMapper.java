package fruit.farm.management.mapper;

import fruit.farm.management.dto.ProfitDTO;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.UserEntity;

public class ProfitMapper {

    public static ProfitEntity mapToEntity(ProfitDTO profitDTO, UserEntity user) {
        if (profitDTO.getSectorDTO() == null) {
            return new ProfitEntity(profitDTO.getProfitType(), profitDTO.getProfit(), profitDTO.getDescription(), profitDTO.getCreatedAt(), profitDTO.isReceived(), user, null);
        }
        return new ProfitEntity(profitDTO.getProfitType(), profitDTO.getProfit(), profitDTO.getDescription(), profitDTO.getCreatedAt(), profitDTO.isReceived(), user, SectorMapper.mapFromDTO(profitDTO.getSectorDTO(), UserMapper.mapFromEntity(user)));
    }

    public static ProfitDTO mapFromEntity(ProfitEntity profitEntity) {
        if(profitEntity.getSectorEntity() == null) {
            return new ProfitDTO(profitEntity.getPurchaseId(), profitEntity.getCreatedAt(), profitEntity.getProfitType(), profitEntity.getProfit(), profitEntity.getDescription(), profitEntity.isReceived(), profitEntity.getUserEntity().getId(), null);
        }
        return new ProfitDTO(profitEntity.getPurchaseId(), profitEntity.getCreatedAt(), profitEntity.getProfitType(), profitEntity.getProfit(), profitEntity.getDescription(), profitEntity.isReceived(), profitEntity.getUserEntity().getId(),
                SectorMapper.mapToDTO(profitEntity.getSectorEntity()));
    }
}
