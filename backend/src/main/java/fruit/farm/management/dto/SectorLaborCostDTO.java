package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SectorLaborCostDTO {

    private String sectorName;

    private BigDecimal sectorLaborCost;

    private BigDecimal paidLaborCost;

    private BigDecimal unpaidLaborCost;

    private Integer totalEntries;

    private Integer paidEntries;

    private Integer unpaidEntries;
}