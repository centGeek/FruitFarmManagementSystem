package fruit.farm.management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SectorLaborCostDto {

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