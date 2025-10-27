package fruit.farm.management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailyAdvancePayDTO {
    private Long id;

    private UserDTO user;

    private UserDTO gardener;

    private LocalDate date;

    private BigDecimal amount;

    private String description;

    private LocalDateTime createdAt;
}