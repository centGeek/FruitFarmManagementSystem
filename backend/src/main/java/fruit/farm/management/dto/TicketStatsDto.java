package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketStatsDto {

    private long total;

    private long open;

    private long inProgress;

    private long closed;
}
