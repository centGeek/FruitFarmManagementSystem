package fruit.farm.management.mapper;

import fruit.farm.management.dto.AdvancePayDTO;
import fruit.farm.management.entity.AdvancePayEntity;

public class AdvancePayMapper {

    public static AdvancePayDTO mapToDTO(AdvancePayEntity advancePayEntity) {

        return new AdvancePayDTO(advancePayEntity.getId(), advancePayEntity.getUser().getId(),
                advancePayEntity.getAmount(), advancePayEntity.getDescription(),
                advancePayEntity.getCreatedAt(), advancePayEntity.isSettled());
    }
}
