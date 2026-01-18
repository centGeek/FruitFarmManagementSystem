package fruit.farm.management.mapper;

import fruit.farm.management.dto.ProfitDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.UserEntity;

public class ProfitMapper {

    public static ProfitEntity mapToEntity(ProfitDto profitDTO, UserDto userDto) {

        UserEntity userEntity = UserMapper.mapToEntity(userDto, null);
        if (profitDTO.getSectorDTO() == null) {
            return new ProfitEntity(profitDTO.getProfitType(), profitDTO.getKilogramsSold(),
                    profitDTO.getProfit(), profitDTO.getDescription(), profitDTO.getCreatedAt(), profitDTO.isReceived(),
                    userEntity, null);
        }
        return new ProfitEntity(profitDTO.getProfitType(), profitDTO.getKilogramsSold(), profitDTO.getProfit(),
                profitDTO.getDescription(), profitDTO.getCreatedAt(), profitDTO.isReceived(), userEntity,
                SectorMapper.mapFromDTO(profitDTO.getSectorDTO(), UserMapper.mapFromEntity(userEntity)));
    }

    public static ProfitDto mapFromEntity(ProfitEntity profitEntity) {

        if (profitEntity.getSectorEntity() == null) {
            return new ProfitDto(profitEntity.getPurchaseId(), profitEntity.getCreatedAt(), profitEntity.getProfitType(), profitEntity.getKilogramsSold(), profitEntity.getProfit(), profitEntity.getDescription(), profitEntity.isReceived(), profitEntity.getUserEntity().getId(), null);
        }
        return new ProfitDto(profitEntity.getPurchaseId(), profitEntity.getCreatedAt(), profitEntity.getProfitType(),
                profitEntity.getKilogramsSold(), profitEntity.getProfit(), profitEntity.getDescription(),
                profitEntity.isReceived(), profitEntity.getUserEntity().getId(),
                SectorMapper.mapToDTO(profitEntity.getSectorEntity()));
    }
}
