package fruit.farm.management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SectorLaborCostDTO {

    private String sectorName;

    @JsonProperty("totalCost") // Mapuje sectorLaborCost na totalCost w JSON
    private BigDecimal sectorLaborCost;

    @JsonProperty("paidCost")
    private BigDecimal paidLaborCost;

    @JsonProperty("unpaidCost")
    private BigDecimal unpaidLaborCost;

    private Integer totalEntries;

    private Integer paidEntries;

    private Integer unpaidEntries;

}