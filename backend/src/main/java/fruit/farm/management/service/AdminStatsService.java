package fruit.farm.management.service;

import fruit.farm.management.dto.AdminStatsDto;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.ExpenseRepository;
import fruit.farm.management.repository.ProfitRepository;
import fruit.farm.management.repository.SectorRepository;
import fruit.farm.management.repository.TicketRepository;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@AllArgsConstructor
@Slf4j
public class AdminStatsService {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private UserRepository userRepository;
    private SectorRepository sectorRepository;
    private ExpenseRepository expenseRepository;
    private ProfitRepository profitRepository;
    private WorkEntryRepository workEntryRepository;
    private TicketRepository ticketRepository;

    public AdminStatsDto getStats() {

        AdminStatsDto.AdminStatsDtoBuilder builder = AdminStatsDto.builder();

        applyUserStats(builder);
        applySectorStats(builder);
        applyWorkStats(builder);
        applyFinanceStats(builder);
        applyTicketStats(builder);

        return builder.build();
    }

    private void applyUserStats(AdminStatsDto.AdminStatsDtoBuilder builder) {
        List<UserEntity> users = userRepository.getAllUsers();
        builder.totalUsers(users.size())
                .admins(countByRole(users, RoleType.ADMIN.getDisplayName()))
                .gardeners(countByRole(users, RoleType.GARDENER.getDisplayName()))
                .employees(countByRole(users, RoleType.EMPLOYEE.getDisplayName()))
                .activeUsers(users.stream().filter(UserEntity::isActive).count())
                .blockedUsers(users.stream().filter(u -> !u.isActive()).count());
    }

    private void applySectorStats(AdminStatsDto.AdminStatsDtoBuilder builder) {
        builder.totalSectors(sectorRepository.count())
                .activeSectors(sectorRepository.countActiveSectors());
    }

    private void applyWorkStats(AdminStatsDto.AdminStatsDtoBuilder builder) {
        builder.totalWorkEntries(workEntryRepository.count())
                .totalKilogramsPicked(workEntryRepository.sumAllKilogramsPicked())
                .totalSalaries(workEntryRepository.sumAllSalaries());
    }

    private void applyFinanceStats(AdminStatsDto.AdminStatsDtoBuilder builder) {
        BigDecimal totalExpenses = expenseRepository.sumAllExpenses();
        BigDecimal paidExpenses = expenseRepository.sumPaidExpenses();
        BigDecimal totalProfits = profitRepository.sumAllProfits();

        builder.totalExpenses(totalExpenses)
                .paidExpenses(paidExpenses)
                .unpaidExpenses(totalExpenses.subtract(paidExpenses))
                .totalProfits(totalProfits)
                .netBalance(totalProfits.subtract(totalExpenses))
                .totalKilogramsSold(profitRepository.sumAllKilogramsSold());
    }

    private void applyTicketStats(AdminStatsDto.AdminStatsDtoBuilder builder) {
        List<TicketEntity> tickets = ticketRepository.findAll();

        builder.totalTickets(tickets.size())
                .openTickets(countByStatus(tickets, TicketStatus.OPEN))
                .inProgressTickets(countByStatus(tickets, TicketStatus.IN_PROGRESS))
                .closedTickets(countByStatus(tickets, TicketStatus.CLOSED))
                .avgTicketCloseHours(averageCloseHours(tickets))
                .ticketsByCategory(ticketsByCategory(tickets))
                .ticketsByMonth(ticketsByMonth(tickets));
    }

    private long countByRole(List<UserEntity> users, String roleName) {
        return users.stream()
                .filter(u -> u.getRole() != null && roleName.equals(u.getRole().getRoleName()))
                .count();
    }

    private long countByStatus(List<TicketEntity> tickets, TicketStatus status) {
        return tickets.stream().filter(t -> t.getStatus() == status).count();
    }

    private Double averageCloseHours(List<TicketEntity> tickets) {
        double[] hours = tickets.stream()
                .filter(t -> t.getClosedAt() != null && t.getCreatedAt() != null)
                .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getClosedAt()).toMinutes() / 60.0)
                .toArray();
        if (hours.length == 0) {
            return null;
        }
        double sum = 0;
        for (double h : hours) {
            sum += h;
        }
        return Math.round(sum / hours.length * 10.0) / 10.0;
    }

    private List<AdminStatsDto.LabelCount> ticketsByCategory(List<TicketEntity> tickets) {
        Map<String, Long> grouped = new LinkedHashMap<>();
        for (TicketEntity t : tickets) {
            String key = (t.getCategory() == null || t.getCategory().isBlank()) ? "Brak kategorii" : t.getCategory();
            grouped.merge(key, 1L, Long::sum);
        }
        return grouped.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new AdminStatsDto.LabelCount(e.getKey(), e.getValue()))
                .toList();
    }

    private List<AdminStatsDto.LabelCount> ticketsByMonth(List<TicketEntity> tickets) {
        Map<String, Long> grouped = new TreeMap<>();
        for (TicketEntity t : tickets) {
            if (t.getCreatedAt() == null) {
                continue;
            }
            grouped.merge(t.getCreatedAt().format(MONTH_FORMAT), 1L, Long::sum);
        }
        List<AdminStatsDto.LabelCount> all = grouped.entrySet().stream()
                .map(e -> new AdminStatsDto.LabelCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(AdminStatsDto.LabelCount::getLabel))
                .toList();
        return all.size() > 12 ? all.subList(all.size() - 12, all.size()) : all;
    }
}
