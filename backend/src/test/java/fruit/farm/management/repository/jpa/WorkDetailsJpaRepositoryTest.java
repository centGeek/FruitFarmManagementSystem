package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkDetailsEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("WorkDetailsJpaRepository")
class WorkDetailsJpaRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    WorkDetailsJpaRepository repository;

    @Autowired
    UserJpaRepository userRepository;

    @Autowired
    RoleJpaRepository roleRepository;

    @Autowired
    TestEntityManager entityManager;

    // The Flyway-seeded gardener (V4__init_user_profile.sql) has nickname "gardener" and id 2.
    private static final String GARDENER_NICKNAME = "gardener";
    private static final long GARDENER_ID = 2L;

    /**
     * Persists a work-details row for the given user with an explicit creation timestamp,
     * so ordering by {@code createdAt} is deterministic regardless of insertion order.
     */
    private WorkDetailsEntity persistWorkDetails(UserEntity user, boolean paidHourly,
                                                 BigDecimal hourlyPay, BigDecimal payPerKilogram,
                                                 LocalDateTime createdAt) {
        WorkDetailsEntity details = new WorkDetailsEntity();
        details.setIsPaidHourly(paidHourly);
        details.setHourlyPay(hourlyPay);
        details.setPayPerKilogram(payPerKilogram);
        details.setCreatedAt(createdAt);
        details.setUserEntity(user);
        return entityManager.persistAndFlush(details);
    }

    /**
     * Creates an employee owned by the supplied gardener so the gardener-scoped query has data.
     */
    private UserEntity persistEmployeeOwnedBy(UserEntity gardener, String nickname) {
        RoleEntity employeeRole = roleRepository.findByRoleName("Employee").orElseThrow();
        UserEntity employee = new UserEntity();
        employee.setName("Eve");
        employee.setSurname("Worker");
        employee.setNickname(nickname);
        employee.setPhoneNumber("222-222-222");
        employee.setEmail(nickname + "@orchmanager.com");
        employee.setCreationDate(LocalDate.of(2024, 1, 1));
        employee.setRole(employeeRole);
        employee.setActive(true);
        employee.setGardener(gardener);
        return entityManager.persistAndFlush(employee);
    }

    @Test
    @DisplayName("findByUserEntityId returns every work-details row belonging to the given user")
    void findByUserEntityId_whenUserHasRows_returnsAllOfThem() {
        // Arrange
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();
        persistWorkDetails(gardener, true, new BigDecimal("20.00"), null,
                LocalDateTime.of(2024, 1, 10, 8, 0));
        persistWorkDetails(gardener, false, null, new BigDecimal("1.50"),
                LocalDateTime.of(2024, 2, 10, 8, 0));

        // Act
        List<WorkDetailsEntity> result = repository.findByUserEntityId(gardener.getId());

        // Assert
        assertThat(result).hasSize(2)
                .allSatisfy(wd -> assertThat(wd.getUserEntity().getId()).isEqualTo(gardener.getId()));
    }

    @Test
    @DisplayName("findByUserEntityId returns an empty list when the user has no work-details rows")
    void findByUserEntityId_whenNoRows_returnsEmptyList() {
        // Arrange: the seeded gardener exists but has no work-details rows yet.
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();

        // Act
        List<WorkDetailsEntity> result = repository.findByUserEntityId(gardener.getId());

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getLatestWorkDetailsForUserByNickname returns the most recently created row for that nickname")
    void getLatestWorkDetailsForUserByNickname_returnsMostRecentRow() {
        // Arrange
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();
        persistWorkDetails(gardener, true, new BigDecimal("18.00"), null,
                LocalDateTime.of(2024, 1, 1, 9, 0));
        WorkDetailsEntity latest = persistWorkDetails(gardener, false, null, new BigDecimal("2.25"),
                LocalDateTime.of(2024, 6, 1, 9, 0));
        // An older row inserted last to prove ordering relies on createdAt, not insertion order.
        persistWorkDetails(gardener, true, new BigDecimal("15.00"), null,
                LocalDateTime.of(2023, 12, 1, 9, 0));

        // Act
        Optional<WorkDetailsEntity> result =
                repository.getLatestWorkDetailsForUserByNickname(GARDENER_NICKNAME);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(latest.getId());
        assertThat(result.get().getIsPaidHourly()).isFalse();
        assertThat(result.get().getPayPerKilogram()).isEqualByComparingTo("2.25");
    }

    @Test
    @DisplayName("getLatestWorkDetailsForUserByNickname returns empty for an unknown nickname")
    void getLatestWorkDetailsForUserByNickname_whenUnknownNickname_returnsEmpty() {
        // Arrange: seed a row for the real gardener so the table is non-empty.
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();
        persistWorkDetails(gardener, true, new BigDecimal("20.00"), null,
                LocalDateTime.of(2024, 1, 10, 8, 0));

        // Act
        Optional<WorkDetailsEntity> result =
                repository.getLatestWorkDetailsForUserByNickname("nobody");

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getLatestWorkDetailsForUserById returns the most recently created row for that user id")
    void getLatestWorkDetailsForUserById_returnsMostRecentRow() {
        // Arrange
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();
        persistWorkDetails(gardener, true, new BigDecimal("12.00"), null,
                LocalDateTime.of(2024, 3, 1, 7, 30));
        WorkDetailsEntity latest = persistWorkDetails(gardener, true, new BigDecimal("30.50"), null,
                LocalDateTime.of(2024, 9, 1, 7, 30));

        // Act
        Optional<WorkDetailsEntity> result = repository.getLatestWorkDetailsForUserById(GARDENER_ID);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(latest.getId());
        assertThat(result.get().getHourlyPay()).isEqualByComparingTo("30.50");
    }

    @Test
    @DisplayName("getLatestWorkDetailsForUserById returns empty when the user id has no work-details rows")
    void getLatestWorkDetailsForUserById_whenNoRows_returnsEmpty() {
        // Arrange: admin (id 1) is seeded but has no work-details rows.
        long adminId = userRepository.findByNickname("admin").orElseThrow().getId();

        // Act
        Optional<WorkDetailsEntity> result = repository.getLatestWorkDetailsForUserById(adminId);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getLatestWorkDetailsByGardener returns the latest row among employees owned by that gardener")
    void getLatestWorkDetailsByGardener_returnsLatestForOwnedEmployee() {
        // Arrange
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();
        UserEntity employee = persistEmployeeOwnedBy(gardener, "employee-of-gardener");
        persistWorkDetails(employee, true, new BigDecimal("16.00"), null,
                LocalDateTime.of(2024, 4, 1, 6, 0));
        WorkDetailsEntity latest = persistWorkDetails(employee, false, null, new BigDecimal("3.75"),
                LocalDateTime.of(2024, 10, 1, 6, 0));

        // Act
        Optional<WorkDetailsEntity> result = repository.getLatestWorkDetailsByGardener(GARDENER_ID);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(latest.getId());
        assertThat(result.get().getUserEntity().getId()).isEqualTo(employee.getId());
        assertThat(result.get().getPayPerKilogram()).isEqualByComparingTo("3.75");
    }

    @Test
    @DisplayName("getLatestWorkDetailsByGardener returns empty when the gardener owns no employees with work-details")
    void getLatestWorkDetailsByGardener_whenNoOwnedRows_returnsEmpty() {
        // Arrange: the gardener has no employees, only its own (gardener-scoped) row which
        // must NOT match because that row's user has no gardener.
        UserEntity gardener = userRepository.findByNickname(GARDENER_NICKNAME).orElseThrow();
        persistWorkDetails(gardener, true, new BigDecimal("25.00"), null,
                LocalDateTime.of(2024, 5, 1, 8, 0));

        // Act
        Optional<WorkDetailsEntity> result = repository.getLatestWorkDetailsByGardener(GARDENER_ID);

        // Assert
        assertThat(result).isEmpty();
    }
}
