package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsDto {

    private long totalUsers;
    private long admins;
    private long gardeners;
    private long employees;
    private long activeUsers;
    private long blockedUsers;

    private long totalSectors;
    private long activeSectors;

    private long totalWorkEntries;
    private long totalKilogramsPicked;
    private BigDecimal totalSalaries;

    private BigDecimal totalExpenses;
    private BigDecimal paidExpenses;
    private BigDecimal unpaidExpenses;
    private BigDecimal totalProfits;
    private BigDecimal netBalance;
    private long totalKilogramsSold;

    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long closedTickets;
    private Double avgTicketCloseHours;

    private List<LabelCount> ticketsByCategory;
    private List<LabelCount> ticketsByMonth;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LabelCount {
        private String label;
        private long count;
    }
}
