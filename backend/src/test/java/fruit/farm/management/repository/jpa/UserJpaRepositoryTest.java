package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("UserJpaRepository")
class UserJpaRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    UserJpaRepository repository;

    @Test
    @DisplayName("findByNickname returns the Flyway-seeded gardener with its profile fields")
    void findByNickname_returnsSeededGardener() {
        Optional<UserEntity> user = repository.findByNickname("gardener");

        assertThat(user).isPresent();
        assertThat(user.get().getName()).isEqualTo("John");
        assertThat(user.get().getSurname()).isEqualTo("Doe");
        assertThat(user.get().getRole().getRoleName()).isEqualTo("Gardener");
    }

    @Test
    @DisplayName("findByNickname returns empty for an unknown nickname")
    void findByNickname_whenUnknown_returnsEmpty() {
        assertThat(repository.findByNickname("nobody")).isEmpty();
    }

    @Test
    @DisplayName("getAllUsersByRoleName filters users by their role name")
    void getAllUsersByRoleName_filtersByRole() {
        List<UserEntity> gardeners = repository.getAllUsersByRoleName("Gardener");
        assertThat(gardeners)
                .extracting(UserEntity::getNickname)
                .containsExactly("gardener");

        List<UserEntity> admins = repository.getAllUsersByRoleName("Admin");
        assertThat(admins)
                .extracting(UserEntity::getNickname)
                .containsExactly("admin");
    }

    @Test
    @DisplayName("countByGardenerId returns zero when a gardener has no employees")
    void countByGardenerId_whenNoEmployees_returnsZero() {
        assertThat(repository.countByGardenerId(2L)).isZero();
    }
}
