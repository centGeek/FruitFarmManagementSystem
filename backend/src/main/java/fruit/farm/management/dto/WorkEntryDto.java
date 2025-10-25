package fruit.farm.management.dto;

import fruit.farm.management.entity.WorkType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkEntryDto {

    private Long entryId;

    private LocalDate workDate;

    private int duration;

    private String description;

    private WorkType workType;

    private LocalDateTime createdAt;

    private UserDTO user;

    private SectorDTO sector;

    private BigDecimal daySalary;

    private long kilogramsPicked;

    private Boolean isPaid;
}