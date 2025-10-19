package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class WorkDetailsDTO {

    private Long id;

    private Boolean isPaidHourly;

    private BigDecimal hourlyPay;

    private BigDecimal payPerKilogram;

    private LocalDateTime createdAt;

    private UserDTO userDTO;

}
