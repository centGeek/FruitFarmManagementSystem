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

}
