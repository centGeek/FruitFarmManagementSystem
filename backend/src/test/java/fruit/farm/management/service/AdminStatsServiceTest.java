package fruit.farm.management.service;

import fruit.farm.management.dto.AdminStatsDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.ExpenseRepository;
import fruit.farm.management.repository.ProfitRepository;
import fruit.farm.management.repository.SectorRepository;
import fruit.farm.management.repository.TicketRepository;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminStatsService")
class AdminStatsServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    SectorRepository sectorRepository;
    @Mock
    ExpenseRepository expenseRepository;
    @Mock
    ProfitRepository profitRepository;
    @Mock
    WorkEntryRepository workEntryRepository;
    @Mock
    TicketRepository ticketRepository;

    @InjectMocks
    AdminStatsService service;

    private UserEntity user(String roleName, boolean active) {
        UserEntity user = new UserEntity();
        user.setActive(active);
        user.setRole(new RoleEntity(1L, roleName));
        return user;
    }

    private TicketEntity ticket(TicketStatus status, String category, LocalDateTime created, LocalDateTime closed) {
        TicketEntity t = new TicketEntity();
        t.setStatus(status);
        t.setCategory(category);
        t.setCreatedAt(created);
        t.setClosedAt(closed);
        return t;
    }

    @BeforeEach
    void setUp() {
        when(userRepository.getAllUsers()).thenReturn(List.of(
                user("Admin", true),
                user("Gardener", true),
                user("Employee", true),
                user("Employee", false)
        ));
        when(sectorRepository.count()).thenReturn(5L);
        when(sectorRepository.countActiveSectors()).thenReturn(3L);
        when(workEntryRepository.count()).thenReturn(10L);
        when(workEntryRepository.sumAllKilogramsPicked()).thenReturn(250L);
        when(workEntryRepository.sumAllSalaries()).thenReturn(new BigDecimal("1234.50"));
        when(expenseRepository.sumAllExpenses()).thenReturn(new BigDecimal("1000.00"));
        when(expenseRepository.sumPaidExpenses()).thenReturn(new BigDecimal("600.00"));
        when(profitRepository.sumAllProfits()).thenReturn(new BigDecimal("2500.00"));
        when(profitRepository.sumAllKilogramsSold()).thenReturn(800L);
    }

    @Test
    @DisplayName("aggregates user counts by role and active status")
    void getStats_aggregatesUserCounts() {
        when(ticketRepository.findAll()).thenReturn(List.of());

        AdminStatsDto stats = service.getStats();

        assertThat(stats.getTotalUsers()).isEqualTo(4);
        assertThat(stats.getAdmins()).isEqualTo(1);
        assertThat(stats.getGardeners()).isEqualTo(1);
        assertThat(stats.getEmployees()).isEqualTo(2);
        assertThat(stats.getActiveUsers()).isEqualTo(3);
        assertThat(stats.getBlockedUsers()).isEqualTo(1);
    }

    @Test
    @DisplayName("computes finance balance as profits minus expenses and splits paid/unpaid")
    void getStats_computesFinanceBalance() {
        when(ticketRepository.findAll()).thenReturn(List.of());

        AdminStatsDto stats = service.getStats();

        assertThat(stats.getTotalExpenses()).isEqualByComparingTo("1000.00");
        assertThat(stats.getPaidExpenses()).isEqualByComparingTo("600.00");
        assertThat(stats.getUnpaidExpenses()).isEqualByComparingTo("400.00");
        assertThat(stats.getTotalProfits()).isEqualByComparingTo("2500.00");
        assertThat(stats.getNetBalance()).isEqualByComparingTo("1500.00");
        assertThat(stats.getTotalKilogramsSold()).isEqualTo(800);
    }

    @Test
    @DisplayName("counts tickets by status and averages close time in hours")
    void getStats_ticketStatusAndAverageCloseTime() {
        LocalDateTime base = LocalDateTime.of(2026, 3, 1, 10, 0);
        when(ticketRepository.findAll()).thenReturn(List.of(
                ticket(TicketStatus.OPEN, "BUG", base, null),
                ticket(TicketStatus.CLOSED, "BUG", base, base.plusHours(2)),
                ticket(TicketStatus.CLOSED, "UI", base, base.plusHours(4)),
                ticket(TicketStatus.IN_PROGRESS, null, base, null)
        ));

        AdminStatsDto stats = service.getStats();

        assertThat(stats.getTotalTickets()).isEqualTo(4);
        assertThat(stats.getOpenTickets()).isEqualTo(1);
        assertThat(stats.getInProgressTickets()).isEqualTo(1);
        assertThat(stats.getClosedTickets()).isEqualTo(2);
        assertThat(stats.getAvgTicketCloseHours()).isEqualTo(3.0);
    }

    @Test
    @DisplayName("groups tickets by category, mapping blank to a placeholder, sorted by count")
    void getStats_groupsTicketsByCategory() {
        LocalDateTime base = LocalDateTime.of(2026, 3, 1, 10, 0);
        when(ticketRepository.findAll()).thenReturn(List.of(
                ticket(TicketStatus.OPEN, "BUG", base, null),
                ticket(TicketStatus.OPEN, "BUG", base, null),
                ticket(TicketStatus.OPEN, null, base, null)
        ));

        AdminStatsDto stats = service.getStats();

        assertThat(stats.getTicketsByCategory()).hasSize(2);
        assertThat(stats.getTicketsByCategory().get(0).getLabel()).isEqualTo("BUG");
        assertThat(stats.getTicketsByCategory().get(0).getCount()).isEqualTo(2);
        assertThat(stats.getTicketsByCategory().get(1).getLabel()).isEqualTo("Brak kategorii");
    }

    @Test
    @DisplayName("groups tickets by month chronologically")
    void getStats_groupsTicketsByMonth() {
        when(ticketRepository.findAll()).thenReturn(List.of(
                ticket(TicketStatus.OPEN, "BUG", LocalDateTime.of(2026, 1, 5, 9, 0), null),
                ticket(TicketStatus.OPEN, "BUG", LocalDateTime.of(2026, 2, 5, 9, 0), null),
                ticket(TicketStatus.OPEN, "BUG", LocalDateTime.of(2026, 2, 20, 9, 0), null)
        ));

        AdminStatsDto stats = service.getStats();

        assertThat(stats.getTicketsByMonth()).hasSize(2);
        assertThat(stats.getTicketsByMonth().get(0).getLabel()).isEqualTo("2026-01");
        assertThat(stats.getTicketsByMonth().get(0).getCount()).isEqualTo(1);
        assertThat(stats.getTicketsByMonth().get(1).getLabel()).isEqualTo("2026-02");
        assertThat(stats.getTicketsByMonth().get(1).getCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("returns null average close time when no tickets are closed")
    void getStats_nullAverageWhenNoClosedTickets() {
        when(ticketRepository.findAll()).thenReturn(List.of(
                ticket(TicketStatus.OPEN, "BUG", LocalDateTime.of(2026, 1, 5, 9, 0), null)
        ));

        AdminStatsDto stats = service.getStats();

        assertThat(stats.getAvgTicketCloseHours()).isNull();
    }
}
