package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.AdvancePayEntity;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.entity.WorkType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository slice test for {@link WorkEntryJpaRepository}, exercising every custom JPQL query
 * against the real PostgreSQL schema built by Flyway on a shared Testcontainers instance.
 *
 * <p>Flyway seeds two users: id 1 = "admin" (role Admin) and id 2 = "gardener" (role Gardener),
 * both with a {@code null} gardener reference. The queries under test filter work entries and
 * advances by {@code user.gardener.id}, so this test seeds an additional employee user that
 * points to the seeded gardener (id 2) before inserting the rows under test.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("WorkEntryJpaRepository")
class WorkEntryJpaRepositoryTest extends AbstractIntegrationTest {

    private static final long SEEDED_GARDENER_ID = 2L;

    @Autowired
    WorkEntryJpaRepository repository;

    @Autowired
    TestEntityManager entityManager;

    private UserEntity gardener;
    private UserEntity employee;
    private RoleEntity employeeRole;

    @BeforeEach
    void setUp() {
        // The Gardener role (id 2) and the gardener user (id 2) are Flyway-seeded.
        gardener = entityManager.find(UserEntity.class, SEEDED_GARDENER_ID);
        employeeRole = entityManager.getEntityManager()
                .createQuery("SELECT r FROM role_entity r WHERE r.roleName = 'Employee'", RoleEntity.class)
                .getSingleResult();
    }

    /**
     * Persists a new employee owned by the Flyway-seeded gardener so that the gardener-scoped
     * queries have rows to match against.
     */
    private UserEntity seedEmployee(String nickname, String surname, UserEntity owningGardener) {
        UserEntity user = new UserEntity();
        user.setName("Anna");
        user.setSurname(surname);
        user.setNickname(nickname);
        user.setPhoneNumber("222-222-222");
        user.setEmail(nickname + "@orchmanager.com");
        user.setCreationDate(LocalDate.now());
        user.setRole(employeeRole);
        user.setActive(true);
        user.setGardener(owningGardener);
        return entityManager.persist(user);
    }

    private SectorEntity seedSector() {
        SectorEntity sector = new SectorEntity();
        sector.setDescription("Sad jabłoniowy");
        sector.setCreatedAt(LocalDate.now());
        sector.setIsActive(true);
        sector.setUserEntity(gardener);
        return entityManager.persist(sector);
    }

    private WorkEntryEntity seedWorkEntry(UserEntity user, SectorEntity sector, LocalDate workDate,
                                          BigDecimal daySalary, long kilograms, boolean paid) {
        WorkEntryEntity entry = new WorkEntryEntity();
        entry.setUser(user);
        entry.setSector(sector);
        entry.setWorkDate(workDate);
        entry.setDuration(8);
        entry.setWorkType(WorkType.HARVEST);
        entry.setDescription("Zbiór owoców");
        entry.setDaySalary(daySalary);
        entry.setKilogramsPicked(kilograms);
        entry.setIsPaid(paid);
        return entityManager.persist(entry);
    }

    private AdvancePayEntity seedAdvance(UserEntity user, BigDecimal amount, boolean settled) {
        AdvancePayEntity advance = new AdvancePayEntity();
        advance.setUser(user);
        advance.setAmount(amount);
        advance.setDescription("Zaliczka");
        advance.setCreatedAt(LocalDate.now());
        advance.setSettled(settled);
        return entityManager.persist(advance);
    }

    @Test
    @DisplayName("sumAllSalaries adds up the daySalary of every work entry")
    void sumAllSalaries_sumsEveryEntrySalary() {
        // Arrange
        employee = seedEmployee("worker_sum", "Nowak", gardener);
        seedWorkEntry(employee, null, LocalDate.of(2026, 1, 10), new BigDecimal("100.50"), 5, false);
        seedWorkEntry(employee, null, LocalDate.of(2026, 1, 11), new BigDecimal("49.50"), 3, true);
        entityManager.flush();
        entityManager.clear();

        // Act
        BigDecimal total = repository.sumAllSalaries();

        // Assert
        assertThat(total).isEqualByComparingTo("150.00");
    }

    @Test
    @DisplayName("sumAllSalaries returns zero (via coalesce) when there are no work entries")
    void sumAllSalaries_whenNoEntries_returnsZero() {
        // Act
        BigDecimal total = repository.sumAllSalaries();

        // Assert
        assertThat(total).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("sumAllKilogramsPicked adds up the kilogramsPicked of every work entry")
    void sumAllKilogramsPicked_sumsEveryEntryKilograms() {
        // Arrange
        employee = seedEmployee("worker_kg", "Nowak", gardener);
        seedWorkEntry(employee, null, LocalDate.of(2026, 1, 10), new BigDecimal("10.00"), 7, false);
        seedWorkEntry(employee, null, LocalDate.of(2026, 1, 11), new BigDecimal("10.00"), 13, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        long total = repository.sumAllKilogramsPicked();

        // Assert
        assertThat(total).isEqualTo(20L);
    }

    @Test
    @DisplayName("sumAllKilogramsPicked returns zero (via coalesce) when there are no work entries")
    void sumAllKilogramsPicked_whenNoEntries_returnsZero() {
        // Act
        long total = repository.sumAllKilogramsPicked();

        // Assert
        assertThat(total).isZero();
    }

    @Test
    @DisplayName("findByUserGardenerId returns only entries whose owner belongs to the given gardener")
    void findByUserGardenerId_returnsOnlyEntriesOwnedByThatGardener() {
        // Arrange
        employee = seedEmployee("worker_owned", "Nowak", gardener);
        UserEntity foreignEmployee = seedEmployee("worker_foreign", "Inny", null);
        WorkEntryEntity owned = seedWorkEntry(employee, null, LocalDate.of(2026, 2, 1),
                new BigDecimal("80.00"), 4, false);
        seedWorkEntry(foreignEmployee, null, LocalDate.of(2026, 2, 1), new BigDecimal("80.00"), 4, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result = repository.findByUserGardenerId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(result)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactly(owned.getEntryId());
    }

    @Test
    @DisplayName("findByUserGardenerId returns empty when the gardener has no work entries")
    void findByUserGardenerId_whenNoEntries_returnsEmpty() {
        // Act
        List<WorkEntryEntity> result = repository.findByUserGardenerId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findWorkEntriesByGivenDayForEmployee filters by employee nickname and exact work date")
    void findWorkEntriesByGivenDayForEmployee_filtersByNicknameAndDate() {
        // Arrange
        employee = seedEmployee("worker_day", "Nowak", gardener);
        LocalDate target = LocalDate.of(2026, 3, 15);
        WorkEntryEntity onTarget = seedWorkEntry(employee, null, target, new BigDecimal("90.00"), 6, false);
        seedWorkEntry(employee, null, target.plusDays(1), new BigDecimal("90.00"), 6, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result = repository.findWorkEntriesByGivenDayForEmployee("worker_day", target);

        // Assert
        assertThat(result)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactly(onTarget.getEntryId());
    }

    @Test
    @DisplayName("findWorkEntriesByGivenDayForEmployee returns empty for a day with no entries")
    void findWorkEntriesByGivenDayForEmployee_whenNoEntryThatDay_returnsEmpty() {
        // Arrange
        employee = seedEmployee("worker_noday", "Nowak", gardener);
        seedWorkEntry(employee, null, LocalDate.of(2026, 3, 15), new BigDecimal("90.00"), 6, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result =
                repository.findWorkEntriesByGivenDayForEmployee("worker_noday", LocalDate.of(2026, 3, 16));

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findAllExpensesByGivenDate filters by gardener, year and month while ignoring null filters")
    void findAllExpensesByGivenDate_filtersByGardenerYearAndMonth() {
        // Arrange
        employee = seedEmployee("worker_exp", "Nowak", gardener);
        WorkEntryEntity january = seedWorkEntry(employee, null, LocalDate.of(2026, 1, 20),
                new BigDecimal("70.00"), 2, false);
        seedWorkEntry(employee, null, LocalDate.of(2026, 2, 20), new BigDecimal("70.00"), 2, false);
        entityManager.flush();
        entityManager.clear();

        // Act: year+month filter selects only the January entry; null sectorId matches null-sector rows
        List<WorkEntryEntity> filtered =
                repository.findAllExpensesByGivenDate(2026, 1, null, SEEDED_GARDENER_ID);

        // Assert
        assertThat(filtered)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactly(january.getEntryId());
    }

    @Test
    @DisplayName("findAllExpensesByGivenDate returns all of the gardener's entries when year and month are null")
    void findAllExpensesByGivenDate_whenYearAndMonthNull_returnsAllForGardener() {
        // Arrange
        employee = seedEmployee("worker_exp_all", "Nowak", gardener);
        WorkEntryEntity january = seedWorkEntry(employee, null, LocalDate.of(2026, 1, 20),
                new BigDecimal("70.00"), 2, false);
        WorkEntryEntity february = seedWorkEntry(employee, null, LocalDate.of(2026, 2, 20),
                new BigDecimal("70.00"), 2, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result =
                repository.findAllExpensesByGivenDate(null, null, null, SEEDED_GARDENER_ID);

        // Assert: both of the gardener's entries are returned regardless of their month
        assertThat(result)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactlyInAnyOrder(january.getEntryId(), february.getEntryId());
    }

    @Test
    @DisplayName("findAllExpensesByGivenDate matches the sector when a sectorId is supplied")
    void findAllExpensesByGivenDate_whenSectorIdSupplied_matchesThatSector() {
        // Arrange
        employee = seedEmployee("worker_exp_sector", "Nowak", gardener);
        SectorEntity sector = seedSector();
        WorkEntryEntity withSector = seedWorkEntry(employee, sector, LocalDate.of(2026, 4, 5),
                new BigDecimal("60.00"), 9, false);
        seedWorkEntry(employee, null, LocalDate.of(2026, 4, 5), new BigDecimal("60.00"), 9, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result =
                repository.findAllExpensesByGivenDate(2026, 4, sector.getSectorId(), SEEDED_GARDENER_ID);

        // Assert
        assertThat(result)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactly(withSector.getEntryId());
    }

    @Test
    @DisplayName("findByUserGardenerIdAndWorkDateBetween returns entries within the inclusive range ordered by date then surname")
    void findByUserGardenerIdAndWorkDateBetween_returnsRangeOrderedByDateThenSurname() {
        // Arrange
        UserEntity nowak = seedEmployee("worker_nowak", "Nowak", gardener);
        UserEntity abacki = seedEmployee("worker_abacki", "Abacki", gardener);
        LocalDate start = LocalDate.of(2026, 5, 1);
        LocalDate end = LocalDate.of(2026, 5, 31);

        // Inclusive boundaries: start date and end date must both be returned.
        WorkEntryEntity onStartNowak = seedWorkEntry(nowak, null, start, new BigDecimal("10.00"), 1, false);
        WorkEntryEntity onStartAbacki = seedWorkEntry(abacki, null, start, new BigDecimal("10.00"), 1, false);
        WorkEntryEntity onEnd = seedWorkEntry(nowak, null, end, new BigDecimal("10.00"), 1, false);
        // Outside the range, must be excluded.
        seedWorkEntry(nowak, null, start.minusDays(1), new BigDecimal("10.00"), 1, false);
        seedWorkEntry(nowak, null, end.plusDays(1), new BigDecimal("10.00"), 1, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result =
                repository.findByUserGardenerIdAndWorkDateBetween(SEEDED_GARDENER_ID, start, end);

        // Assert: same-day rows ordered by surname (Abacki before Nowak), then the later end-date row
        assertThat(result)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactly(onStartAbacki.getEntryId(), onStartNowak.getEntryId(), onEnd.getEntryId());
    }

    @Test
    @DisplayName("findByUserGardenerIdAndWorkDateBetween returns empty when no entry falls in the range")
    void findByUserGardenerIdAndWorkDateBetween_whenNoneInRange_returnsEmpty() {
        // Arrange
        employee = seedEmployee("worker_range_empty", "Nowak", gardener);
        seedWorkEntry(employee, null, LocalDate.of(2026, 1, 1), new BigDecimal("10.00"), 1, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result = repository.findByUserGardenerIdAndWorkDateBetween(
                SEEDED_GARDENER_ID, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30));

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getUnpaidEntriesByUserId returns only the unpaid entries of the given user")
    void getUnpaidEntriesByUserId_returnsOnlyUnpaidForUser() {
        // Arrange
        employee = seedEmployee("worker_unpaid", "Nowak", gardener);
        WorkEntryEntity unpaid = seedWorkEntry(employee, null, LocalDate.of(2026, 1, 5),
                new BigDecimal("40.00"), 2, false);
        seedWorkEntry(employee, null, LocalDate.of(2026, 1, 6), new BigDecimal("40.00"), 2, true);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<WorkEntryEntity> result = repository.getUnpaidEntriesByUserId(employee.getId());

        // Assert
        assertThat(result)
                .extracting(WorkEntryEntity::getEntryId)
                .containsExactly(unpaid.getEntryId());
    }

    @Test
    @DisplayName("payAllUnpaidEntries marks every unpaid entry up to today as paid and returns the update count")
    void payAllUnpaidEntries_marksPastUnpaidEntriesAsPaid() {
        // Arrange
        employee = seedEmployee("worker_pay", "Nowak", gardener);
        WorkEntryEntity pastUnpaid = seedWorkEntry(employee, null, LocalDate.now().minusDays(1),
                new BigDecimal("30.00"), 1, false);
        WorkEntryEntity alreadyPaid = seedWorkEntry(employee, null, LocalDate.now().minusDays(2),
                new BigDecimal("30.00"), 1, true);
        WorkEntryEntity futureUnpaid = seedWorkEntry(employee, null, LocalDate.now().plusDays(1),
                new BigDecimal("30.00"), 1, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        int updated = repository.payAllUnpaidEntries(employee.getId());

        // Assert: only the single past-and-unpaid row is settled
        assertThat(updated).isEqualTo(1);
        assertThat(entityManager.find(WorkEntryEntity.class, pastUnpaid.getEntryId()).getIsPaid()).isTrue();
        assertThat(entityManager.find(WorkEntryEntity.class, alreadyPaid.getEntryId()).getIsPaid()).isTrue();
        assertThat(entityManager.find(WorkEntryEntity.class, futureUnpaid.getEntryId()).getIsPaid()).isFalse();
    }

    @Test
    @DisplayName("payAllUnpaidEntriesForCurrentMonth marks only unpaid entries of the current month as paid")
    void payAllUnpaidEntriesForCurrentMonth_marksCurrentMonthUnpaidEntriesAsPaid() {
        // Arrange
        employee = seedEmployee("worker_pay_month", "Nowak", gardener);
        LocalDate today = LocalDate.now();
        WorkEntryEntity currentMonthUnpaid = seedWorkEntry(employee, null, today,
                new BigDecimal("30.00"), 1, false);
        WorkEntryEntity previousMonthUnpaid = seedWorkEntry(employee, null, today.minusMonths(1),
                new BigDecimal("30.00"), 1, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        int updated = repository.payAllUnpaidEntriesForCurrentMonth(employee.getId());

        // Assert
        assertThat(updated).isEqualTo(1);
        assertThat(entityManager.find(WorkEntryEntity.class, currentMonthUnpaid.getEntryId()).getIsPaid()).isTrue();
        assertThat(entityManager.find(WorkEntryEntity.class, previousMonthUnpaid.getEntryId()).getIsPaid()).isFalse();
    }

    @Test
    @DisplayName("getUnsettledAdvancesByUserId returns only the unsettled advances of the given user")
    void getUnsettledAdvancesByUserId_returnsOnlyUnsettledForUser() {
        // Arrange
        employee = seedEmployee("worker_adv_user", "Nowak", gardener);
        AdvancePayEntity unsettled = seedAdvance(employee, new BigDecimal("200.00"), false);
        seedAdvance(employee, new BigDecimal("100.00"), true);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<AdvancePayEntity> result = repository.getUnsettledAdvancesByUserId(employee.getId());

        // Assert
        assertThat(result)
                .extracting(AdvancePayEntity::getId)
                .containsExactly(unsettled.getId());
        assertThat(result.get(0).getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    @DisplayName("getUnsettledAdvancesByGardenerId returns unsettled advances of employees owned by the gardener")
    void getUnsettledAdvancesByGardenerId_returnsUnsettledAdvancesForGardenersEmployees() {
        // Arrange
        employee = seedEmployee("worker_adv_gardener", "Nowak", gardener);
        UserEntity foreignEmployee = seedEmployee("worker_adv_foreign", "Inny", null);
        AdvancePayEntity owned = seedAdvance(employee, new BigDecimal("150.00"), false);
        seedAdvance(employee, new BigDecimal("75.00"), true);
        seedAdvance(foreignEmployee, new BigDecimal("300.00"), false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<AdvancePayEntity> result = repository.getUnsettledAdvancesByGardenerId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(result)
                .extracting(AdvancePayEntity::getId)
                .containsExactly(owned.getId());
    }

    @Test
    @DisplayName("getUnsettledAdvancesByGardenerId returns empty when the gardener's employees have no unsettled advances")
    void getUnsettledAdvancesByGardenerId_whenAllSettled_returnsEmpty() {
        // Arrange
        employee = seedEmployee("worker_adv_settled", "Nowak", gardener);
        seedAdvance(employee, new BigDecimal("150.00"), true);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<AdvancePayEntity> result = repository.getUnsettledAdvancesByGardenerId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(result).isEmpty();
    }
}
