package fruit.farm.management.dto;

import fruit.farm.management.entity.ProductType;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ExpenseDto {

    private Long id;

    @NotNull(message = "Typ produktu/usługi jest wymagany.")
    private ProductType type;

    @NotNull(message = "Kwota wydatku jest wymagana.")
    @DecimalMin(value = "0.01", message = "Kwota musi być większa niż 0.")
    private BigDecimal amount;

    @NotNull(message = "Data wydatku jest wymagana.")
    private LocalDate createdAt;

    @NotNull(message = "Opis wydatku.")
    private String description;

    private boolean isPaid;

    private Long userId;

    private SectorDto sectorDTO;
}