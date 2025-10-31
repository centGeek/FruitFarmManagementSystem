package fruit.farm.management.mapper;

import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkDetailsEntity;

public class WorkDetailsMapper {

    public static WorkDetailsDTO mapFromEntity(WorkDetailsEntity workDetailsEntity) {

        return new WorkDetailsDTO(workDetailsEntity.getId(), workDetailsEntity.getIsPaidHourly(),
                workDetailsEntity.getHourlyPay(), workDetailsEntity.getPayPerKilogram(), workDetailsEntity.getCreatedAt(),
                UserMapper.mapFromEntity(workDetailsEntity.getUserEntity()));
    }
    public static WorkDetailsDTO mapToDTO(WorkDetailsEntity entity) {
        WorkDetailsDTO dto = new WorkDetailsDTO();
        dto.setId(entity.getId());
        dto.setIsPaidHourly(entity.getIsPaidHourly());
        dto.setHourlyPay(entity.getHourlyPay());
        dto.setPayPerKilogram(entity.getPayPerKilogram());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUserDTO(UserMapper.mapFromEntity(entity.getUserEntity()));
        return dto;
    }

}
