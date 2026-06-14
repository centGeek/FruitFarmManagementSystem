package fruit.farm.management.dto;

import fruit.farm.management.entity.ProfitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ProfitDto {

    private Long purchaseId;

    @NotNull(message = "{date.required}")
    private LocalDate createdAt;

    @NotNull(message = "{producttype.required}")
    private ProfitType profitType;

    @NotNull(message = "{profit.kilograms.required}")
    private Long kilogramsSold;

    @NotNull(message = "{amount.required}")
    @DecimalMin(value = "0.01", message = "{amount.positive}")
    private BigDecimal profit;

    @NotNull(message = "{expense.description.required}")
    private String description;

    @NotNull(message = "{profit.received.required}")
    private boolean received;

    private Long userId;

    private SectorDto sectorDTO;
}
