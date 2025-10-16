package fruit.farm.management.controller;

import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.TaskDefinitionEntity;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import fruit.farm.management.repository.SectorRepository;
import fruit.farm.management.repository.TaskDefinitionRepository;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.mapper.SectorMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/work-entries")
@AllArgsConstructor
@Slf4j
public class WorkEntryController {

    private WorkEntryRepository workEntryRepository;
    private UserRepository userRepository;
    private SectorRepository sectorRepository;
    private TaskDefinitionRepository taskDefinitionRepository;
    @GetMapping
    public ResponseEntity<List<WorkEntryDto>> getAllWorkEntries() {
        log.info("Getting list of all work entries");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            log.info("Logged user: {}", loggedInEmail);

            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<WorkEntryEntity> entries = workEntryRepository.findByUserGardenerId(gardener.getId());

            List<WorkEntryDto> dtos = entries.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());

            log.info("Found {} work entries", dtos.size());
            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            log.error("Error fetching work entries: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkEntryById(@PathVariable Long id) {
        log.info("Getting work entry by ID: {}", id);
        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryDto dto = mapToDto(optionalEntry.get());
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("Error getting work entry by ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get work entry: " + e.getMessage()));
        }
    }

    @PostMapping()
    public ResponseEntity<?> createWorkEntries(@RequestBody List<WorkEntryDto> requests) {
        log.info("Creating bulk work entries, count: {}", requests.size());
        log.info("Request body: {}", requests);

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<WorkEntryEntity> entriesToSave = new ArrayList<>();

            for (WorkEntryDto request : requests) {
                log.info("Processing entry for userId: {}", request.getUser());

                UserEntity user = userRepository.findByEmail(request.getUser().getEmail())
                        .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getUser().getEmail()));

                if (!user.getGardener().getId().equals(gardener.getId())) {
                    throw new RuntimeException("User does not belong to logged gardener");
                }

                WorkEntryEntity entry = new WorkEntryEntity();
                entry.setUser(user);
                entry.setStartTime(request.getStartTime());
                entry.setEndTime(request.getEndTime());

                if (request.getStartTime() != null && request.getEndTime() != null) {
                    Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
                    entry.setDuration(duration.toHoursPart());
                }

                entry.setDescription(request.getDescription());
                entry.setIsApproved(request.getIsApproved() != null ? request.getIsApproved() : false);
                entry.setCreatedAt(LocalDateTime.now());

                if (request.getSector().getId() != null) {
                    SectorEntity sector = sectorRepository.findById(request.getSector().getId())
                            .orElseThrow(() -> new RuntimeException("Sector not found with ID: " + request.getSector().getId()));
                    entry.setSector(sector);
                }

                if (request.getTasks() != null && !request.getTasks().isEmpty()) {
                    Set<TaskDefinitionEntity> tasks = new HashSet<>();
                    for (WorkEntryDto.TaskBasicDto taskId : request.getTasks()) {
                        TaskDefinitionEntity task = taskDefinitionRepository.findById(taskId.getTaskDefId())
                                .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));
                        tasks.add(task);
                    }
                    entry.setTasks(tasks);
                }

                entriesToSave.add(entry);
            }

            List<WorkEntryEntity> savedEntries = workEntryRepository.saveAll(entriesToSave);

            List<WorkEntryDto> dtos = savedEntries.stream()
                    .map(this::mapToDto)
                    .toList();

            log.info("Successfully created {} work entries", savedEntries.size());

            return ResponseEntity.ok(Map.of(
                    "message", "Work entries created successfully",
                    "count", savedEntries.size(),
                    "entries", dtos
            ));

        } catch (Exception e) {
            log.error("Error creating bulk work entries: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Creation failed: " + e.getMessage()));
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkEntry(@PathVariable Long id, @RequestBody WorkEntryDto request) {
        log.info("Attempting to update work entry with ID: {}", id);
        log.info("Update request body: {}", request);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity existingEntry = optionalEntry.get();

            if (request.getStartTime() != null) {
                existingEntry.setStartTime(request.getStartTime());
            }
            if (request.getEndTime() != null) {
                existingEntry.setEndTime(request.getEndTime());
            }

            if (existingEntry.getStartTime() != null && existingEntry.getEndTime() != null) {
                Duration duration = Duration.between(existingEntry.getStartTime(), existingEntry.getEndTime());
                existingEntry.setDuration(duration.toHoursPart());
            }

            if (request.getDescription() != null) {
                existingEntry.setDescription(request.getDescription());
            }
            if (request.getIsApproved() != null) {
                existingEntry.setIsApproved(request.getIsApproved());
            }

            if (request.getSector().getId() != null) {
                SectorEntity sector = sectorRepository.findById(request.getSector().getId())
                        .orElseThrow(() -> new RuntimeException("Sector not found"));
                existingEntry.setSector(sector);
            }

            if (request.getTasks() != null) {
                Set<TaskDefinitionEntity> tasks = new HashSet<>();
                for (WorkEntryDto.TaskBasicDto taskId : request.getTasks()) {
                    TaskDefinitionEntity task = taskDefinitionRepository.findById(taskId.getTaskDefId())
                            .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));
                    tasks.add(task);
                }
                existingEntry.setTasks(tasks);
            }

            WorkEntryEntity updatedEntry = workEntryRepository.save(existingEntry);
            WorkEntryDto dto = mapToDto(updatedEntry);

            log.info("Work entry updated successfully with ID: {}", id);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry updated successfully",
                    "entry", dto
            ));

        } catch (Exception e) {
            log.error("Error updating work entry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<?> toggleApproval(@PathVariable Long id, @RequestBody Map<String, Boolean> approvalRequest) {
        log.info("Attempting to toggle approval for work entry ID: {}", id);
        log.info("Approval request: {}", approvalRequest);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity entry = optionalEntry.get();

            Boolean newApprovalStatus = approvalRequest.get("isApproved");
            if (newApprovalStatus == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Missing 'isApproved' field in request"));
            }

            log.info("Changing work entry {} approval from {} to {}",
                    id, entry.getIsApproved(), newApprovalStatus);

            entry.setIsApproved(newApprovalStatus);
            WorkEntryEntity updatedEntry = workEntryRepository.save(entry);

            String action = newApprovalStatus ? "approved" : "unapproved";
            log.info("Work entry {} successfully {}", id, action);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry approval status updated successfully",
                    "id", id.toString(),
                    "isApproved", newApprovalStatus.toString(),
                    "action", action
            ));

        } catch (Exception e) {
            log.error("Error toggling approval: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Approval update failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkEntry(@PathVariable Long id) {
        log.info("Attempting to delete work entry with ID: {}", id);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity entry = optionalEntry.get();
            workEntryRepository.delete(entry);
            log.info("Work entry {} deleted successfully", id);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry deleted successfully",
                    "id", id.toString()
            ));

        } catch (Exception e) {
            log.error("Error deleting work entry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    private WorkEntryDto mapToDto(WorkEntryEntity entity) {
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
                .isApproved(entity.getIsApproved())
                .createdAt(entity.getCreatedAt())
                .user(userDto)
                .sector(sectorDto)
                .tasks(taskDtos)
                .build();
    }
}