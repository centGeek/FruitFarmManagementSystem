package fruit.farm.management.repository.jpa;

import fruit.farm.management.AbstractIntegrationTest;
import fruit.farm.management.entity.PlantType;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("SelectorJpaRepository")
class SelectorJpaRepositoryTest extends AbstractIntegrationTest {

    /** Primary key of the Flyway-seeded "gardener" user (V4__init_user_profile.sql). */
    private static final long SEEDED_GARDENER_ID = 2L;

    @Autowired
    SelectorJpaRepository repository;

    @Autowired
    UserJpaRepository userRepository;

    @Autowired
    TestEntityManager entityManager;

    /**
     * Persists a sector owned by the given user. {@code is_active} is NOT NULL in the schema
     * (V5__add_sector_table.sql), so it is always supplied explicitly.
     */
    private SectorEntity persistSector(UserEntity owner, PlantType plantType, boolean active) {
        SectorEntity sector = new SectorEntity();
        sector.setPlantType(plantType);
        sector.setVariety("OTHER");
        sector.setDescription("Sad testowy");
        sector.setCreatedAt(LocalDate.of(2024, 5, 1));
        sector.setIsActive(active);
        sector.setUserEntity(owner);
        return entityManager.persist(sector);
    }

    private UserEntity seededGardener() {
        return userRepository.findById(SEEDED_GARDENER_ID).orElseThrow();
    }

    @Test
    @DisplayName("countActiveSectors counts only sectors whose is_active flag is true")
    void countActiveSectors_countsOnlyActiveSectors() {
        // Arrange: capture the baseline so the test does not depend on a pristine database
        long baseline = repository.countActiveSectors();
        UserEntity gardener = seededGardener();
        persistSector(gardener, PlantType.JABŁOŃ, true);
        persistSector(gardener, PlantType.GRUSZA, true);
        persistSector(gardener, PlantType.WIŚNIA, false); // archived -> not counted
        entityManager.flush();
        entityManager.clear();

        // Act
        long activeCount = repository.countActiveSectors();

        // Assert: only the two active sectors are added to the count, the archived one is ignored
        assertThat(activeCount).isEqualTo(baseline + 2L);
    }

    @Test
    @DisplayName("countActiveSectors does not change when only archived sectors are added")
    void countActiveSectors_whenOnlyArchivedSectorsAdded_isUnchanged() {
        // Arrange
        long baseline = repository.countActiveSectors();
        UserEntity gardener = seededGardener();
        persistSector(gardener, PlantType.MALINA, false);
        persistSector(gardener, PlantType.ARONIA, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        long activeCount = repository.countActiveSectors();

        // Assert: archived sectors are never counted, so the count stays at the baseline
        assertThat(activeCount).isEqualTo(baseline);
    }

    @Test
    @DisplayName("findAllActiveByUserId returns only the active sectors belonging to the given user")
    void findAllActiveByUserId_returnsOnlyActiveSectorsOfThatUser() {
        // Arrange
        UserEntity gardener = seededGardener();
        SectorEntity activeApple = persistSector(gardener, PlantType.JABŁOŃ, true);
        SectorEntity activePear = persistSector(gardener, PlantType.GRUSZA, true);
        persistSector(gardener, PlantType.WIŚNIA, false); // archived -> excluded
        entityManager.flush();
        entityManager.clear();

        // Act
        List<SectorEntity> active = repository.findAllActiveByUserId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(active)
                .extracting(SectorEntity::getSectorId)
                .containsExactlyInAnyOrder(activeApple.getSectorId(), activePear.getSectorId());
        assertThat(active)
                .extracting(SectorEntity::getIsActive)
                .containsOnly(true);
    }

    @Test
    @DisplayName("findAllActiveByUserId excludes sectors owned by other users")
    void findAllActiveByUserId_excludesOtherUsersSectors() {
        // Arrange: seeded gardener (id 2) owns one active sector; admin (id 1) owns another active sector
        UserEntity gardener = seededGardener();
        UserEntity admin = userRepository.findById(1L).orElseThrow();
        SectorEntity gardenerSector = persistSector(gardener, PlantType.BORÓWKA, true);
        persistSector(admin, PlantType.ARONIA, true); // belongs to a different user -> excluded
        entityManager.flush();
        entityManager.clear();

        // Act
        List<SectorEntity> active = repository.findAllActiveByUserId(SEEDED_GARDENER_ID);

        // Assert: only the queried user's sector is returned, the other user's active sector is filtered out
        assertThat(active)
                .extracting(SectorEntity::getSectorId)
                .containsExactly(gardenerSector.getSectorId());
        assertThat(active)
                .extracting(sector -> sector.getUserEntity().getId())
                .containsOnly(SEEDED_GARDENER_ID);
    }

    @Test
    @DisplayName("findAllActiveByUserId returns an empty list for a user with no active sectors")
    void findAllActiveByUserId_whenNoActiveSectors_returnsEmptyList() {
        // Arrange: the user only owns an archived sector
        UserEntity gardener = seededGardener();
        persistSector(gardener, PlantType.PORZECZKA_CZARNA, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<SectorEntity> active = repository.findAllActiveByUserId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(active).isEmpty();
    }

    @Test
    @DisplayName("findAllArchivedByUserId returns only the archived sectors belonging to the given user")
    void findAllArchivedByUserId_returnsOnlyArchivedSectorsOfThatUser() {
        // Arrange
        UserEntity gardener = seededGardener();
        persistSector(gardener, PlantType.JABŁOŃ, true); // active -> excluded
        SectorEntity archivedCherry = persistSector(gardener, PlantType.WIŚNIA, false);
        SectorEntity archivedPlum = persistSector(gardener, PlantType.ŚLIWA, false);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<SectorEntity> archived = repository.findAllArchivedByUserId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(archived)
                .extracting(SectorEntity::getSectorId)
                .containsExactlyInAnyOrder(archivedCherry.getSectorId(), archivedPlum.getSectorId());
        assertThat(archived)
                .extracting(SectorEntity::getIsActive)
                .containsOnly(false);
    }

    @Test
    @DisplayName("findAllArchivedByUserId returns an empty list for a user with no archived sectors")
    void findAllArchivedByUserId_whenNoArchivedSectors_returnsEmptyList() {
        // Arrange: the user only owns an active sector
        UserEntity gardener = seededGardener();
        persistSector(gardener, PlantType.TRUSKAWKA, true);
        entityManager.flush();
        entityManager.clear();

        // Act
        List<SectorEntity> archived = repository.findAllArchivedByUserId(SEEDED_GARDENER_ID);

        // Assert
        assertThat(archived).isEmpty();
    }

    @Test
    @DisplayName("findAllArchivedByUserId returns an empty list for a user id that owns no sectors")
    void findAllArchivedByUserId_whenUnknownUser_returnsEmptyList() {
        // Arrange / Act
        List<SectorEntity> archived = repository.findAllArchivedByUserId(99_999L);

        // Assert
        assertThat(archived).isEmpty();
    }
}
