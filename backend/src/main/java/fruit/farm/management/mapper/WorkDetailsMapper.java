package fruit.farm.management.mapper;

import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.entity.WorkDetailsEntity;

public class WorkDetailsMapper {

    public static WorkDetailsDto mapFromEntity(WorkDetailsEntity workDetailsEntity) {

        return new WorkDetailsDto(workDetailsEntity.getId(), workDetailsEntity.getIsPaidHourly(),
                workDetailsEntity.getHourlyPay(), workDetailsEntity.getPayPerKilogram(), workDetailsEntity.getCreatedAt(),
                UserMapper.mapFromEntity(workDetailsEntity.getUserEntity()));
    }
    public static WorkDetailsDto mapToDTO(WorkDetailsEntity entity) {
        WorkDetailsDto dto = new WorkDetailsDto();
        dto.setId(entity.getId());
        dto.setIsPaidHourly(entity.getIsPaidHourly());
        dto.setHourlyPay(entity.getHourlyPay());
        dto.setPayPerKilogram(entity.getPayPerKilogram());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUserDTO(UserMapper.mapFromEntity(entity.getUserEntity()));
        return dto;
    }

}
