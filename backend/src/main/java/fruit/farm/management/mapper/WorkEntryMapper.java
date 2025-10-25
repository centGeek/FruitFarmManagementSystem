package fruit.farm.management.mapper;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.WorkEntryEntity;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class WorkEntryMapper {

    public static WorkEntryDto mapToDto(WorkEntryEntity entity) {
        UserDTO userDto = null;
        if (entity.getUser() != null) {
            userDto = UserMapper.mapFromEntity(entity.getUser());
        }

        SectorDTO sectorDto = null;
        if (entity.getSector() != null) {
            sectorDto = SectorMapper.mapToDTO(entity.getSector());
        }

        return WorkEntryDto.builder()
                .entryId(entity.getEntryId())
                .duration(entity.getDuration())
                .workDate(entity.getWorkDate())
                .description(entity.getDescription())
                .workType(entity.getWorkType())
                .createdAt(entity.getCreatedAt())
                .user(userDto)
                .sector(sectorDto)
                .daySalary(entity.getDaySalary())
                .kilogramsPicked(entity.getKilogramsPicked())
                .isPaid(entity.getIsPaid())
                .build();
    }
}