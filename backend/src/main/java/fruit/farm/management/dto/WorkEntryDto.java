package fruit.farm.management.dto;

import fruit.farm.management.entity.WorkType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
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

    private WorkType workType;

    private Boolean isApproved;

    private LocalDateTime createdAt;

    private UserDTO user;

    private SectorDTO sector;
}