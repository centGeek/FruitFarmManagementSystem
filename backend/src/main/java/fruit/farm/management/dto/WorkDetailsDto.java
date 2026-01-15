package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class WorkDetailsDto {

    private Long id;

    private Boolean isPaidHourly;

    private BigDecimal hourlyPay;

    private BigDecimal payPerKilogram;

    private LocalDateTime createdAt;

    private UserDto userDTO;

    public WorkDetailsDto(Boolean isPaidHourly, BigDecimal hourlyPay, BigDecimal payPerKilogram, LocalDateTime createdAt, UserDto userDTO) {
        this.isPaidHourly = isPaidHourly;
        this.hourlyPay = hourlyPay;
        this.payPerKilogram = payPerKilogram;
        this.createdAt = createdAt;
        this.userDTO = userDTO;
    }
}
