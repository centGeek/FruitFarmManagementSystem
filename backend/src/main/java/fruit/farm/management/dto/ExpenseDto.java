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

    @NotNull(message = "{producttype.required}")
    private ProductType type;

    @NotNull(message = "{amount.required}")
    @DecimalMin(value = "0.01", message = "{amount.positive}")
    private BigDecimal amount;

    @NotNull(message = "{date.required}")
    private LocalDate createdAt;

    @NotNull(message = "{expense.description.required}")
    private String description;

    private boolean isPaid;

    private Long userId;

    private SectorDto sectorDTO;
}