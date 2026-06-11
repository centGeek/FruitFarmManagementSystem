package fruit.farm.management.mapper;

import fruit.farm.management.dto.AuditLogDto;
import fruit.farm.management.entity.AuditLogEntity;

public class AuditLogMapper {

    public static AuditLogDto mapFromEntity(AuditLogEntity entity) {

        return AuditLogDto.builder()
                .id(entity.getId())
                .performedById(entity.getPerformedById())
                .performedByName(entity.getPerformedByName())
                .action(entity.getAction() != null ? entity.getAction().name() : null)
                .targetType(entity.getTargetType())
                .targetId(entity.getTargetId())
                .details(entity.getDetails())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
