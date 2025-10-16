package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkEntryDto {

    private Long entryId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private int duration;

    private String description;

    private Boolean isApproved;

    private LocalDateTime createdAt;

    private UserDTO user;

    private SectorDTO sector;

    private Set<TaskBasicDto> tasks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskBasicDto {
        private Long taskDefId;
        private String taskName;
    }
}