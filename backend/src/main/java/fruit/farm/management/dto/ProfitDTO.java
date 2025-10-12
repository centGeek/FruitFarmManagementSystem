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
public class ProfitDTO {

    private Long purchaseId;

    @NotNull(message = "Data wydatku jest wymagana.")
    private LocalDate createdAt;

    @NotNull(message = "Typ produktu/usługi jest wymagany.")
    private ProfitType profitType;

    @NotNull(message = "Sprzedano w kilogramach.")
    private long kilogramsSold;

    @NotNull(message = "Kwota wydatku jest wymagana.")
    @DecimalMin(value = "0.01", message = "Kwota musi być większa niż 0.")
    private BigDecimal profit;

    @NotNull(message = "Opis wydatku.")
    private String description;

    @NotNull(message = "Czy otrzymano zapłatę?")
    private boolean received;

    private Long userId;

    private SectorDTO sectorDTO;
}
