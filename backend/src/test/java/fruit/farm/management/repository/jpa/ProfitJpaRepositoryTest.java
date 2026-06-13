package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.ProfitType;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.BeforeEach;
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

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("ProfitJpaRepository")
class ProfitJpaRepositoryTest extends AbstractIntegrationTest {

    // Flyway-seeded users (V4__init_user_profile.sql): id 1 = admin (role Admin), id 2 = gardener (role Gardener).
    private static final long SEEDED_GARDENER_ID = 2L;

    @Autowired
    ProfitJpaRepository repository;

    @Autowired
    RoleJpaRepository roleJpaRepository;

    @Autowired
    TestEntityManager entityManager;

    private UserEntity seededGardener;

    @BeforeEach
    void loadSeededGardener() {
        // Reuse the Flyway-seeded gardener so the role-name JPQL literal ("Gardener") matches.
        seededGardener = entityManager.find(UserEntity.class, SEEDED_GARDENER_ID);
        assertThat(seededGardener).isNotNull();
        assertThat(seededGardener.getRole().getRoleName()).isEqualTo("Gardener");
    }

    private ProfitEntity persistProfit(ProfitType type, Long kilograms, String profit, LocalDate createdAt, UserEntity owner) {
        ProfitEntity entity = new ProfitEntity(
                type,
                kilograms,
                profit == null ? null : new BigDecimal(profit),
                "Sprzedaż owoców",
                createdAt,
                true,
                owner,
                null
        );
        return entityManager.persistAndFlush(entity);
    }

    @Test
    @DisplayName("sumAllProfits returns zero when there are no profit rows")
    void sumAllProfits_whenNoRows_returnsZero() {
        // Act
        BigDecimal sum = repository.sumAllProfits();

        // Assert
        assertThat(sum).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("sumAllProfits aggregates the profit column across every row regardless of owner")
    void sumAllProfits_aggregatesAllRows() {
        // Arrange
        persistProfit(ProfitType.SPRZEDAZ_JABLEK, 100L, "150.50", LocalDate.of(2026, 1, 10), seededGardener);
        persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 40L, "49.50", LocalDate.of(2026, 2, 10), seededGardener);
        persistProfit(ProfitType.SUBSYDIA, null, "300.00", LocalDate.of(2026, 3, 10), null);

        // Act
        BigDecimal sum = repository.sumAllProfits();

        // Assert
        assertThat(sum).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("sumAllKilogramsSold returns zero when there are no profit rows")
    void sumAllKilogramsSold_whenNoRows_returnsZero() {
        // Act
        long sum = repository.sumAllKilogramsSold();

        // Assert
        assertThat(sum).isZero();
    }

    @Test
    @DisplayName("sumAllKilogramsSold aggregates the kilograms_sold column across every row")
    void sumAllKilogramsSold_aggregatesAllRows() {
        // Arrange
        persistProfit(ProfitType.SPRZEDAZ_JABLEK, 100L, "150.00", LocalDate.of(2026, 1, 10), seededGardener);
        persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 55L, "80.00", LocalDate.of(2026, 2, 10), seededGardener);
        // Null kilograms must be ignored by SUM, not break the query.
        persistProfit(ProfitType.SUBSYDIA, null, "300.00", LocalDate.of(2026, 3, 10), seededGardener);

        // Act
        long sum = repository.sumAllKilogramsSold();

        // Assert
        assertThat(sum).isEqualTo(155L);
    }

    @Test
    @DisplayName("getAllProfitsByGardener returns every profit owned by the given gardener")
    void getAllProfitsByGardener_returnsProfitsForGardener() {
        // Arrange
        ProfitEntity first = persistProfit(ProfitType.SPRZEDAZ_JABLEK, 100L, "150.00", LocalDate.of(2026, 1, 10), seededGardener);
        ProfitEntity second = persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 40L, "60.00", LocalDate.of(2026, 2, 10), seededGardener);

        // Act
        List<ProfitEntity> profits = repository.getAllProfitsByGardener(SEEDED_GARDENER_ID);

        // Assert
        assertThat(profits)
                .extracting(ProfitEntity::getPurchaseId)
                .containsExactlyInAnyOrder(first.getPurchaseId(), second.getPurchaseId());
    }

    @Test
    @DisplayName("getAllProfitsByGardener excludes profits owned by a non-Gardener user")
    void getAllProfitsByGardener_whenOwnerIsNotGardener_excludesThem() {
        // Arrange: create an Employee-role user that owns a profit; the JPQL literal "Gardener" must filter it out.
        RoleEntity employeeRole = roleJpaRepository.findByRoleName("Employee").orElseThrow();
        UserEntity employee = new UserEntity(
                "Eva", "Worker", "employee-eva", "222-222-222", "eva@orchmanager.com",
                LocalDate.of(2026, 1, 1), employeeRole, true, seededGardener, null, null, null
        );
        UserEntity persistedEmployee = entityManager.persistAndFlush(employee);
        // Guard against a vacuous pass: prove the owner is genuinely a non-Gardener role.
        assertThat(persistedEmployee.getRole().getRoleName()).isEqualTo("Employee").isNotEqualTo("Gardener");
        persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "5.00", LocalDate.of(2026, 1, 10), persistedEmployee);

        // Act: query against the employee's id.
        List<ProfitEntity> profits = repository.getAllProfitsByGardener(persistedEmployee.getId());

        // Assert: the role filter rejects the employee's rows.
        assertThat(profits).isEmpty();
    }

    @Test
    @DisplayName("getAllProfitsByGardener returns empty when the gardener has no profits")
    void getAllProfitsByGardener_whenNoProfits_returnsEmpty() {
        // Act
        List<ProfitEntity> profits = repository.getAllProfitsByGardener(SEEDED_GARDENER_ID);

        // Assert
        assertThat(profits).isEmpty();
    }

    @Test
    @DisplayName("findByUserId without year/month filters returns all of the user's profits newest-first")
    void findByUserId_withoutDateFilters_ordersByCreatedAtDesc() {
        // Arrange
        ProfitEntity older = persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "10.00", LocalDate.of(2025, 5, 1), seededGardener);
        ProfitEntity newest = persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 20L, "20.00", LocalDate.of(2026, 5, 1), seededGardener);
        ProfitEntity middle = persistProfit(ProfitType.SUBSYDIA, null, "30.00", LocalDate.of(2025, 12, 1), seededGardener);

        // Act
        Page<ProfitEntity> page = repository.findByUserId(SEEDED_GARDENER_ID, null, null, Pageable.unpaged());

        // Assert
        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent())
                .extracting(ProfitEntity::getPurchaseId)
                .containsExactly(newest.getPurchaseId(), middle.getPurchaseId(), older.getPurchaseId());
    }

    @Test
    @DisplayName("findByUserId filters out profits belonging to other users")
    void findByUserId_filtersByUser() {
        // Arrange: a profit with no owner (user_id NULL) must never match a concrete user id.
        persistProfit(ProfitType.SUBSYDIA, null, "999.00", LocalDate.of(2026, 1, 1), null);
        ProfitEntity owned = persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "10.00", LocalDate.of(2026, 1, 1), seededGardener);

        // Act
        Page<ProfitEntity> page = repository.findByUserId(SEEDED_GARDENER_ID, null, null, Pageable.unpaged());

        // Assert
        assertThat(page.getContent())
                .extracting(ProfitEntity::getPurchaseId)
                .containsExactly(owned.getPurchaseId());
    }

    @Test
    @DisplayName("findByUserId with a year filter returns only profits created in that year")
    void findByUserId_withYearFilter_filtersByYear() {
        // Arrange
        ProfitEntity in2025 = persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "10.00", LocalDate.of(2025, 6, 15), seededGardener);
        persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 20L, "20.00", LocalDate.of(2026, 6, 15), seededGardener);

        // Act
        Page<ProfitEntity> page = repository.findByUserId(SEEDED_GARDENER_ID, 2025, null, Pageable.unpaged());

        // Assert
        assertThat(page.getContent())
                .extracting(ProfitEntity::getPurchaseId)
                .containsExactly(in2025.getPurchaseId());
    }

    @Test
    @DisplayName("findByUserId with year and month filters narrows results to that month")
    void findByUserId_withYearAndMonthFilter_filtersByMonth() {
        // Arrange
        ProfitEntity march = persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "10.00", LocalDate.of(2026, 3, 5), seededGardener);
        persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 20L, "20.00", LocalDate.of(2026, 4, 5), seededGardener);
        persistProfit(ProfitType.SUBSYDIA, null, "30.00", LocalDate.of(2025, 3, 5), seededGardener);

        // Act
        Page<ProfitEntity> page = repository.findByUserId(SEEDED_GARDENER_ID, 2026, 3, Pageable.unpaged());

        // Assert
        assertThat(page.getContent())
                .extracting(ProfitEntity::getPurchaseId)
                .containsExactly(march.getPurchaseId());
    }

    @Test
    @DisplayName("findByUserId honors the page size and exposes pagination metadata")
    void findByUserId_appliesPagination() {
        // Arrange
        persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "10.00", LocalDate.of(2026, 1, 1), seededGardener);
        persistProfit(ProfitType.SPRZEDAZ_GRUSZEK, 20L, "20.00", LocalDate.of(2026, 2, 1), seededGardener);
        persistProfit(ProfitType.SUBSYDIA, null, "30.00", LocalDate.of(2026, 3, 1), seededGardener);

        // Act
        Page<ProfitEntity> firstPage = repository.findByUserId(SEEDED_GARDENER_ID, null, null, PageRequest.of(0, 2));

        // Assert
        assertThat(firstPage.getTotalElements()).isEqualTo(3);
        assertThat(firstPage.getTotalPages()).isEqualTo(2);
        assertThat(firstPage.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("findByUserId returns an empty page when the user has no matching profits")
    void findByUserId_whenNoMatches_returnsEmptyPage() {
        // Arrange: only a 2025 profit exists.
        persistProfit(ProfitType.SPRZEDAZ_JABLEK, 10L, "10.00", LocalDate.of(2025, 1, 1), seededGardener);

        // Act: ask for 2030, which has none.
        Page<ProfitEntity> page = repository.findByUserId(SEEDED_GARDENER_ID, 2030, null, Pageable.unpaged());

        // Assert
        assertThat(page.getTotalElements()).isZero();
        assertThat(page.getContent()).isEmpty();
    }
}
