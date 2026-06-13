package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.PlantType;
import fruit.farm.management.entity.ProductType;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The schema and the {@code admin} (Admin role, id 1) and {@code gardener} (Gardener role, id 2)
 * profiles are owned by Flyway. {@code @DataJpaTest} rolls each test back, so the only expense
 * rows visible inside a test are the ones that test inserts.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("ExpenseJpaRepository")
class ExpenseJpaRepositoryTest extends AbstractIntegrationTest {

    private static final long ADMIN_ID = 1L;
    private static final long GARDENER_ID = 2L;

    @Autowired
    ExpenseJpaRepository repository;

    @Autowired
    UserJpaRepository userRepository;

    @Autowired
    SelectorJpaRepository sectorRepository;

    @Autowired
    TestEntityManager entityManager;

    private UserEntity gardener() {
        return userRepository.findById(GARDENER_ID).orElseThrow();
    }

    private UserEntity admin() {
        return userRepository.findById(ADMIN_ID).orElseThrow();
    }

    private ExpenseEntity persistExpense(BigDecimal cost, boolean paid, LocalDate createdAt,
                                         UserEntity owner, SectorEntity sector) {
        ExpenseEntity expense = new ExpenseEntity(
                ProductType.NAWOZY, cost, "wydatek", createdAt, owner, paid, sector);
        return entityManager.persistFlushFind(expense);
    }

    private SectorEntity persistSector(UserEntity owner) {
        SectorEntity sector = new SectorEntity();
        sector.setPlantType(PlantType.JABŁOŃ);
        sector.setVariety("GALA");
        sector.setDescription("sektor");
        sector.setCreatedAt(LocalDate.of(2024, 1, 1));
        sector.setIsActive(true);
        sector.setUserEntity(owner);
        return entityManager.persistFlushFind(sector);
    }

    @Test
    @DisplayName("sumAllExpenses returns zero (not null) when there are no expenses")
    void sumAllExpenses_whenNoExpenses_returnsZero() {
        // Act
        BigDecimal total = repository.sumAllExpenses();

        // Assert: the COALESCE guards against a NULL sum
        assertThat(total).isNotNull().isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("sumAllExpenses adds up the cost of every expense regardless of paid state")
    void sumAllExpenses_sumsEveryExpense() {
        // Arrange
        persistExpense(new BigDecimal("10.50"), true, LocalDate.of(2024, 5, 1), gardener(), null);
        persistExpense(new BigDecimal("4.25"), false, LocalDate.of(2024, 5, 2), gardener(), null);

        // Act
        BigDecimal total = repository.sumAllExpenses();

        // Assert
        assertThat(total).isEqualByComparingTo("14.75");
    }

    @Test
    @DisplayName("sumPaidExpenses returns zero (not null) when there are no paid expenses")
    void sumPaidExpenses_whenNoPaidExpenses_returnsZero() {
        // Arrange: only an unpaid expense exists
        persistExpense(new BigDecimal("99.99"), false, LocalDate.of(2024, 5, 1), gardener(), null);

        // Act
        BigDecimal total = repository.sumPaidExpenses();

        // Assert
        assertThat(total).isNotNull().isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("sumPaidExpenses adds up only the expenses flagged as paid")
    void sumPaidExpenses_sumsOnlyPaidExpenses() {
        // Arrange
        persistExpense(new BigDecimal("100.00"), true, LocalDate.of(2024, 5, 1), gardener(), null);
        persistExpense(new BigDecimal("50.00"), true, LocalDate.of(2024, 5, 2), gardener(), null);
        persistExpense(new BigDecimal("7.00"), false, LocalDate.of(2024, 5, 3), gardener(), null);

        // Act
        BigDecimal total = repository.sumPaidExpenses();

        // Assert: the unpaid 7.00 is excluded
        assertThat(total).isEqualByComparingTo("150.00");
    }

    @Test
    @DisplayName("getAllExpensesByGardener returns every expense owned by the given Gardener user")
    void getAllExpensesByGardener_returnsExpensesOfThatGardener() {
        // Arrange
        ExpenseEntity first = persistExpense(new BigDecimal("12.00"), true, LocalDate.of(2024, 6, 1), gardener(), null);
        ExpenseEntity second = persistExpense(new BigDecimal("8.00"), false, LocalDate.of(2024, 6, 2), gardener(), null);

        // Act
        List<ExpenseEntity> expenses = repository.getAllExpensesByGardener(GARDENER_ID);

        // Assert
        assertThat(expenses)
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactlyInAnyOrder(first.getExpenseId(), second.getExpenseId());
    }

    @Test
    @DisplayName("getAllExpensesByGardener returns nothing when the user id is not a Gardener")
    void getAllExpensesByGardener_whenUserIsNotGardener_returnsEmpty() {
        // Arrange: the expense belongs to the Admin user, whose role is not "Gardener".
        UserEntity admin = admin();
        // Guard against a vacuous pass: prove the admin is genuinely a non-Gardener role.
        assertThat(admin.getRole().getRoleName()).isEqualTo("Admin").isNotEqualTo("Gardener");
        persistExpense(new BigDecimal("20.00"), true, LocalDate.of(2024, 6, 1), admin, null);

        // Act
        List<ExpenseEntity> expenses = repository.getAllExpensesByGardener(ADMIN_ID);

        // Assert: the role guard in the query filters the admin out
        assertThat(expenses).isEmpty();
    }

    @Test
    @DisplayName("getAllExpensesByGardener returns nothing for an unknown user id")
    void getAllExpensesByGardener_whenUserUnknown_returnsEmpty() {
        // Act
        List<ExpenseEntity> expenses = repository.getAllExpensesByGardener(999_999L);

        // Assert
        assertThat(expenses).isEmpty();
    }

    @Test
    @DisplayName("getExpenseById returns the matching expense with its persisted fields")
    void getExpenseById_returnsMatchingExpense() {
        // Arrange
        ExpenseEntity saved = persistExpense(new BigDecimal("33.33"), true, LocalDate.of(2024, 7, 4), gardener(), null);

        // Act
        ExpenseEntity found = repository.getExpenseById(saved.getExpenseId());

        // Assert
        assertThat(found).isNotNull();
        assertThat(found.getExpenseId()).isEqualTo(saved.getExpenseId());
        assertThat(found.getExpenseCost()).isEqualByComparingTo("33.33");
        assertThat(found.getProductType()).isEqualTo(ProductType.NAWOZY);
        assertThat(found.isPaid()).isTrue();
    }

    @Test
    @DisplayName("getExpenseById returns null when no expense has the given id")
    void getExpenseById_whenIdUnknown_returnsNull() {
        // Act
        ExpenseEntity found = repository.getExpenseById(999_999L);

        // Assert
        assertThat(found).isNull();
    }

    @Test
    @DisplayName("findFilteredByUserId returns only the expenses owned by the requested user")
    void findFilteredByUserId_filtersByOwningUser() {
        // Arrange
        ExpenseEntity gardenerExpense = persistExpense(new BigDecimal("11.00"), true, LocalDate.of(2024, 8, 1), gardener(), null);
        persistExpense(new BigDecimal("22.00"), true, LocalDate.of(2024, 8, 1), admin(), null);

        // Act: no year/month/sector filter
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, null, null, Pageable.unpaged(), null);

        // Assert: the admin-owned expense is excluded
        assertThat(page.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(gardenerExpense.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId orders the matched expenses by creation date descending")
    void findFilteredByUserId_ordersByCreatedAtDescending() {
        // Arrange
        ExpenseEntity oldest = persistExpense(new BigDecimal("1.00"), true, LocalDate.of(2024, 1, 1), gardener(), null);
        ExpenseEntity middle = persistExpense(new BigDecimal("2.00"), true, LocalDate.of(2024, 6, 15), gardener(), null);
        ExpenseEntity newest = persistExpense(new BigDecimal("3.00"), true, LocalDate.of(2024, 12, 31), gardener(), null);

        // Act
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, null, null, Pageable.unpaged(), null);

        // Assert
        assertThat(page.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(newest.getExpenseId(), middle.getExpenseId(), oldest.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId keeps only expenses created in the requested year")
    void findFilteredByUserId_filtersByYear() {
        // Arrange
        ExpenseEntity in2024 = persistExpense(new BigDecimal("5.00"), true, LocalDate.of(2024, 3, 10), gardener(), null);
        persistExpense(new BigDecimal("6.00"), true, LocalDate.of(2023, 3, 10), gardener(), null);

        // Act
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, 2024, null, Pageable.unpaged(), null);

        // Assert
        assertThat(page.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(in2024.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId keeps only expenses created in the requested month")
    void findFilteredByUserId_filtersByMonth() {
        // Arrange
        ExpenseEntity inMay = persistExpense(new BigDecimal("5.00"), true, LocalDate.of(2024, 5, 10), gardener(), null);
        persistExpense(new BigDecimal("6.00"), true, LocalDate.of(2024, 4, 10), gardener(), null);

        // Act
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, null, 5, Pageable.unpaged(), null);

        // Assert
        assertThat(page.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(inMay.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId combines year and month into a single calendar-month filter")
    void findFilteredByUserId_filtersByYearAndMonthTogether() {
        // Arrange
        ExpenseEntity match = persistExpense(new BigDecimal("5.00"), true, LocalDate.of(2024, 5, 10), gardener(), null);
        persistExpense(new BigDecimal("6.00"), true, LocalDate.of(2023, 5, 10), gardener(), null); // same month, other year
        persistExpense(new BigDecimal("7.00"), true, LocalDate.of(2024, 4, 10), gardener(), null); // same year, other month

        // Act
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, 2024, 5, Pageable.unpaged(), null);

        // Assert
        assertThat(page.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(match.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId keeps only expenses attached to the requested sector")
    void findFilteredByUserId_filtersBySector() {
        // Arrange
        SectorEntity sectorA = persistSector(gardener());
        SectorEntity sectorB = persistSector(gardener());
        ExpenseEntity inSectorA = persistExpense(new BigDecimal("5.00"), true, LocalDate.of(2024, 5, 10), gardener(), sectorA);
        persistExpense(new BigDecimal("6.00"), true, LocalDate.of(2024, 5, 11), gardener(), sectorB);

        // Act
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, null, null, Pageable.unpaged(), sectorA.getSectorId());

        // Assert
        assertThat(page.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(inSectorA.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId honours the requested page size and reports total elements")
    void findFilteredByUserId_appliesPagination() {
        // Arrange: three expenses for the same user, newest first is the December one
        persistExpense(new BigDecimal("1.00"), true, LocalDate.of(2024, 1, 1), gardener(), null);
        persistExpense(new BigDecimal("2.00"), true, LocalDate.of(2024, 6, 15), gardener(), null);
        ExpenseEntity newest = persistExpense(new BigDecimal("3.00"), true, LocalDate.of(2024, 12, 31), gardener(), null);

        // Act: first page holds a single, newest-first element
        Page<ExpenseEntity> firstPage = repository.findFilteredByUserId(
                GARDENER_ID, null, null, PageRequest.of(0, 1), null);

        // Assert
        assertThat(firstPage.getTotalElements()).isEqualTo(3);
        assertThat(firstPage.getTotalPages()).isEqualTo(3);
        assertThat(firstPage.getContent())
                .extracting(ExpenseEntity::getExpenseId)
                .containsExactly(newest.getExpenseId());
    }

    @Test
    @DisplayName("findFilteredByUserId returns an empty page when no expense matches the filter")
    void findFilteredByUserId_whenNoMatch_returnsEmptyPage() {
        // Arrange
        persistExpense(new BigDecimal("5.00"), true, LocalDate.of(2024, 5, 10), gardener(), null);

        // Act: filter on a year that has no expenses
        Page<ExpenseEntity> page = repository.findFilteredByUserId(
                GARDENER_ID, 1999, null, Pageable.unpaged(), null);

        // Assert
        assertThat(page.getContent()).isEmpty();
        assertThat(page.getTotalElements()).isZero();
    }
}
