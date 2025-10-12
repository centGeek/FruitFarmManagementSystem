package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Set;

/**
 * DTO dla encji WorkEntryEntity. Używane w warstwie API/Controller.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkEntryDto {

    private Long entryId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Duration duration;

    private String description;

    private Boolean isApproved;

    private LocalDateTime createdAt;

    private Long userId;

    private Long sectorId;

    private Set<Long> taskIds;
}