package fruit.farm.management.mapper;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.repository.SectorRepository;
import fruit.farm.management.repository.TaskDefinitionRepository;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@AllArgsConstructor
public class WorkEntryMapper {

    private final UserRepository userRepository;
    private final SectorRepository sectorRepository;
    private final TaskDefinitionRepository taskDefinitionRepository;




    public WorkEntryDto mapFromEntity(WorkEntryEntity entity) {

        if (entity == null) {
            return null;
        }

        WorkEntryDto dto = new WorkEntryDto();
        dto.setEntryId(entity.getEntryId());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setDuration(entity.getDuration());
        dto.setDescription(entity.getDescription());
        dto.setIsApproved(entity.getIsApproved());
        dto.setCreatedAt(entity.getCreatedAt());

//        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
//        dto.setSectorId(entity.getSector() != null ? entity.getSector().getSectorId() : null);
//
//        if (entity.getTasks() != null) {
//            dto.setTaskIds(entity.getTasks().stream()
//                    .map(TaskDefinitionEntity::getTaskDefId)
//                    .collect(Collectors.toSet()));
//        } else {
//            dto.setTaskIds(new HashSet<>());
//        }

        return dto;
    }

    public static WorkEntryDto mapToDto(WorkEntryEntity entity) {
        UserDTO userDto = null;
        if (entity.getUser() != null) {
            userDto = UserMapper.mapFromEntity(entity.getUser());
        }

        SectorDTO sectorDto = null;
        if (entity.getSector() != null) {
            sectorDto = SectorMapper.mapToDTO(entity.getSector());
        }

        Set<WorkEntryDto.TaskBasicDto> taskDtos = new HashSet<>();
        if (entity.getTasks() != null) {
            taskDtos = entity.getTasks().stream()
                    .map(task -> WorkEntryDto.TaskBasicDto.builder()
                            .taskDefId(task.getTaskDefId())
                            .taskName(task.getTaskName())
                            .build())
                    .collect(Collectors.toSet());
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
                .tasks(taskDtos)
                .build();
    }
}