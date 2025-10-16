package fruit.farm.management.mapper;

import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.TaskDefinitionEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.repository.SectorRepository;
import fruit.farm.management.repository.TaskDefinitionRepository;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
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

    public WorkEntryEntity mapToEntity(WorkEntryDto dto) {
        if (dto == null) {
            return null;
        }

        WorkEntryEntity entity = new WorkEntryEntity();

        entity.setEntryId(dto.getEntryId());
        entity.setStartTime(dto.getStartTime());
        entity.setEndTime(dto.getEndTime());
        entity.setDuration(dto.getDuration());
        entity.setDescription(dto.getDescription());
        entity.setIsApproved(dto.getIsApproved() != null ? dto.getIsApproved() : false);
        entity.setCreatedAt(dto.getCreatedAt());

//        if (dto.getUserId() != null) {
//
//            entity.setUser(userRepository.findById(dto.getUserId()).orElse(null));
//        }
//        if (dto.getSectorId() != null) {
//
//            entity.setSector(sectorRepository.findById(dto.getSectorId()).orElse(null));
//        }
//
//        if (dto.getTaskIds() != null && !dto.getTaskIds().isEmpty()) {
//            entity.setTasks(dto.getTaskIds().stream()
//                    .flatMap(id -> taskDefinitionRepository.findById(id).stream())
//                    .collect(Collectors.toSet()));
//        } else {
//            entity.setTasks(new HashSet<>());
//        }

        return entity;
    }
}