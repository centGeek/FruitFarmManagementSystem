package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;


@AllArgsConstructor
@NoArgsConstructor
@Data
public class AdvancePayDto {

    private Long id;

    private Long userId;

    private BigDecimal amount;

    private String description;

    private LocalDate createdAt;

    private boolean isSettled;
}