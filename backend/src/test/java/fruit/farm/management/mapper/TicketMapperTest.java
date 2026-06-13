package fruit.farm.management.mapper;

import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TicketMapper")
class TicketMapperTest {

    private UserEntity reporter(long id, String nickname) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("Jan");
        user.setSurname("Kowalski");
        user.setNickname(nickname);
        user.setPhoneNumber("111-222-333");
        user.setEmail(nickname + "@orch.com");
        user.setCreationDate(LocalDate.of(2026, 1, 1));
        user.setActive(true);
        user.setLocalityName("Warsaw");
        return user;
    }

    @Test
    @DisplayName("mapFromEntity copies every scalar field and nests the reporting user DTO")
    void mapFromEntity_whenUserPresent_copiesFieldsAndNestsUserDto() {
        // Arrange
        TicketEntity entity = new TicketEntity();
        entity.setId(42L);
        entity.setDescription("Przeciekający zawór nawadniania w sektorze A");
        entity.setCategory("Nawadnianie");
        entity.setCreatedAt(LocalDateTime.of(2026, 6, 10, 9, 30));
        entity.setClosedAt(LocalDateTime.of(2026, 6, 12, 14, 0));
        entity.setAdminComment("Zlecono naprawę");
        entity.setStatus(TicketStatus.CLOSED);
        entity.setUserEntity(reporter(7L, "employee"));

        // Act
        TicketDto dto = TicketMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getDescription()).isEqualTo("Przeciekający zawór nawadniania w sektorze A");
        assertThat(dto.getCategory()).isEqualTo("Nawadnianie");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 10, 9, 30));
        assertThat(dto.getClosedAt()).isEqualTo(LocalDateTime.of(2026, 6, 12, 14, 0));
        assertThat(dto.getAdminComment()).isEqualTo("Zlecono naprawę");
        assertThat(dto.getStatus()).isEqualTo(TicketStatus.CLOSED);
        assertThat(dto.getUserDto()).isNotNull();
        assertThat(dto.getUserDto().getId()).isEqualTo(7L);
        assertThat(dto.getUserDto().getNickname()).isEqualTo("employee");
        assertThat(dto.getUserDto().getEmail()).isEqualTo("employee@orch.com");
        assertThat(dto.getUserDto().getLocalityName()).isEqualTo("Warsaw");
    }

    @Test
    @DisplayName("mapFromEntity leaves the user DTO null when the ticket has no reporting user")
    void mapFromEntity_whenUserNull_leavesUserDtoNull() {
        // Arrange
        TicketEntity entity = new TicketEntity();
        entity.setId(1L);
        entity.setDescription("Brak prądu w stodole");
        entity.setCategory("Infrastruktura");
        entity.setCreatedAt(LocalDateTime.of(2026, 6, 13, 8, 0));
        entity.setClosedAt(null);
        entity.setAdminComment(null);
        entity.setStatus(TicketStatus.OPEN);
        entity.setUserEntity(null);

        // Act
        TicketDto dto = TicketMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getUserDto()).isNull();
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getDescription()).isEqualTo("Brak prądu w stodole");
        assertThat(dto.getCategory()).isEqualTo("Infrastruktura");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 13, 8, 0));
        assertThat(dto.getClosedAt()).isNull();
        assertThat(dto.getAdminComment()).isNull();
        assertThat(dto.getStatus()).isEqualTo(TicketStatus.OPEN);
    }

    @Test
    @DisplayName("mapFromEntity preserves null closedAt, null category and IN_PROGRESS status while still nesting the user DTO")
    void mapFromEntity_whenInProgress_preservesNullsAndStillNestsUserDto() {
        // Arrange
        TicketEntity entity = new TicketEntity();
        entity.setId(99L);
        entity.setDescription("Uszkodzona siatka przeciwgradowa");
        entity.setCategory(null);
        entity.setCreatedAt(LocalDateTime.of(2026, 6, 5, 11, 15));
        entity.setClosedAt(null);
        entity.setAdminComment(null);
        entity.setStatus(TicketStatus.IN_PROGRESS);
        entity.setUserEntity(reporter(3L, "gardener"));

        // Act
        TicketDto dto = TicketMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(99L);
        assertThat(dto.getDescription()).isEqualTo("Uszkodzona siatka przeciwgradowa");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 5, 11, 15));
        assertThat(dto.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        assertThat(dto.getClosedAt()).isNull();
        assertThat(dto.getCategory()).isNull();
        assertThat(dto.getAdminComment()).isNull();
        assertThat(dto.getUserDto()).isNotNull();
        assertThat(dto.getUserDto().getId()).isEqualTo(3L);
        assertThat(dto.getUserDto().getNickname()).isEqualTo("gardener");
    }
}
