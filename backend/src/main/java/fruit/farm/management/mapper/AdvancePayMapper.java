package fruit.farm.management.mapper;

import fruit.farm.management.dto.AdvancePayDto;
import fruit.farm.management.entity.AdvancePayEntity;

public class AdvancePayMapper {

    public static AdvancePayDto mapToDTO(AdvancePayEntity advancePayEntity) {

        return new AdvancePayDto(advancePayEntity.getId(), advancePayEntity.getUser().getId(),
                advancePayEntity.getAmount(), advancePayEntity.getDescription(),
                advancePayEntity.getCreatedAt(), advancePayEntity.isSettled());
    }
}
