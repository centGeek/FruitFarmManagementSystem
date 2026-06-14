package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Repository slice test for {@link TicketJpaRepository#findAllFiltered}, exercising the admin
 * support-ticket query against the real PostgreSQL schema built by Flyway on a shared
 * Testcontainers instance.
 *
 * <p>Regression guard for the "function lower(bytea) does not exist" crash: a {@code null} search
 * term wrapped in {@code CONCAT(...)} gives PostgreSQL no type to infer, so it defaults the bind to
 * {@code bytea} and the whole query blows up. The query must therefore compare against a
 * pre-lowercased, %-wrapped pattern ({@code LIKE :search}) built in the service layer, where a
 * {@code null} pattern is well-typed and short-circuits cleanly.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("TicketJpaRepository.findAllFiltered")
class TicketJpaRepositoryTest extends AbstractIntegrationTest {

    private static final Pageable FIRST_PAGE = PageRequest.of(0, 10);

    @Autowired
    TicketJpaRepository repository;

    @Autowired
    TestEntityManager entityManager;

    private UserEntity reporter;

    @BeforeEach
    void setUp() {
        // Flyway seeds the Gardener role (id 2) and the gardener user (id 2); reuse the Employee
        // role to own a reporter with distinctive name fields for the user-search assertions.
        RoleEntity employeeRole = entityManager.getEntityManager()
                .createQuery("SELECT r FROM role_entity r WHERE r.roleName = 'Employee'", RoleEntity.class)
                .getSingleResult();
        UserEntity gardener = entityManager.find(UserEntity.class, 2L);

        UserEntity user = new UserEntity();
        user.setName("Anna");
        user.setSurname("Kowalska");
        user.setNickname("anka");
        user.setPhoneNumber("111-111-111");
        user.setEmail("anka@orchmanager.com");
        user.setCreationDate(LocalDate.now());
        user.setRole(employeeRole);
        user.setActive(true);
        user.setGardener(gardener);
        reporter = entityManager.persist(user);

        seedTicket("Aplikacja się zawiesza po zalogowaniu", TicketStatus.OPEN);
        seedTicket("Raport pokazuje złe dane", TicketStatus.IN_PROGRESS);
        seedTicket("Sugestia usprawnienia widoku", TicketStatus.CLOSED);
        entityManager.flush();
        entityManager.clear();
    }

    private void seedTicket(String description, TicketStatus status) {
        TicketEntity ticket = new TicketEntity();
        ticket.setUserEntity(reporter);
        ticket.setDescription(description);
        ticket.setCategory("OTHER");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setStatus(status);
        entityManager.persist(ticket);
    }

    @Test
    @DisplayName("returns every ticket and does not crash when status and search are both null")
    void findAllFiltered_whenNoFilters_returnsAllWithoutBlowingUp() {
        // The null-search path is the one that previously threw "function lower(bytea) does not exist".
        assertThatCode(() -> {
            Page<TicketEntity> page = repository.findAllFiltered(null, null, FIRST_PAGE);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("filters by status when a status is supplied and search is null")
    void findAllFiltered_byStatus_returnsOnlyMatchingStatus() {
        Page<TicketEntity> page = repository.findAllFiltered(TicketStatus.OPEN, null, FIRST_PAGE);

        assertThat(page.getContent())
                .extracting(TicketEntity::getStatus)
                .containsExactly(TicketStatus.OPEN);
    }

    @Test
    @DisplayName("matches the (pre-lowercased, %-wrapped) search pattern against the description case-insensitively")
    void findAllFiltered_bySearchPattern_matchesDescription() {
        Page<TicketEntity> page = repository.findAllFiltered(null, "%aplikacja%", FIRST_PAGE);

        assertThat(page.getContent())
                .extracting(TicketEntity::getDescription)
                .containsExactly("Aplikacja się zawiesza po zalogowaniu");
    }

    @Test
    @DisplayName("matches the search pattern against the reporter's name fields")
    void findAllFiltered_bySearchPattern_matchesUserFields() {
        Page<TicketEntity> page = repository.findAllFiltered(null, "%kowalska%", FIRST_PAGE);

        assertThat(page.getTotalElements()).isEqualTo(3);
    }

    @Test
    @DisplayName("returns nothing when the search pattern matches no ticket or reporter")
    void findAllFiltered_bySearchPattern_whenNoMatch_returnsEmpty() {
        Page<TicketEntity> page = repository.findAllFiltered(null, "%nieistnieje%", FIRST_PAGE);

        assertThat(page.getTotalElements()).isZero();
    }
}
