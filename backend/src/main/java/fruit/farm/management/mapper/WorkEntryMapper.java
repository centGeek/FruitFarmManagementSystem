package fruit.farm.management.mapper;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.repository.SectorRepository;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

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
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .duration(entity.getDuration())
                .description(entity.getDescription())
                .workType(entity.getWorkType())
                .isApproved(entity.getIsApproved())
                .createdAt(entity.getCreatedAt())
                .user(userDto)
                .sector(sectorDto)
                .build();
    }
}