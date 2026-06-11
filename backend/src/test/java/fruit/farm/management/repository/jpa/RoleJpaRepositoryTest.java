package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.RoleEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("RoleJpaRepository")
class RoleJpaRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    RoleJpaRepository repository;

    @Test
    @DisplayName("findByRoleName returns a role seeded by Flyway")
    void findByRoleName_returnsFlywaySeededRole() {
        Optional<RoleEntity> gardener = repository.findByRoleName("Gardener");

        assertThat(gardener).isPresent();
        assertThat(gardener.get().getRoleName()).isEqualTo("Gardener");
        assertThat(gardener.get().getId()).isNotNull();
    }

    @Test
    @DisplayName("findByRoleName returns empty for an unknown role")
    void findByRoleName_whenRoleDoesNotExist_returnsEmpty() {
        Optional<RoleEntity> result = repository.findByRoleName("NoSuchRole");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Flyway seeds all three roles")
    void flywaySeedsAllThreeRoles() {
        assertThat(repository.findByRoleName("Admin")).isPresent();
        assertThat(repository.findByRoleName("Gardener")).isPresent();
        assertThat(repository.findByRoleName("Employee")).isPresent();
    }
}
