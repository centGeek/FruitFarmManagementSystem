package fruit.farm.management.mapper;

import fruit.farm.management.dto.UserCredentialsDto;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserCredentialsMapper")
class UserCredentialsMapperTest {

    private UserEntity baseUser(long id, String nickname) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("John");
        user.setSurname("Doe");
        user.setNickname(nickname);
        user.setEmail(nickname + "@orch.com");
        return user;
    }

    @Test
    @DisplayName("mapToEntity links the owner and copies the raw password from the DTO")
    void mapToEntity_withUserAndDto_linksOwnerAndCopiesPassword() {
        // Arrange
        UserEntity owner = baseUser(7L, "owner");
        UserCredentialsDto dto = new UserCredentialsDto("rawPassword123", "rawPassword123");

        // Act
        UserCredentialsEntity entity = UserCredentialsMapper.mapToEntity(owner, dto);

        // Assert
        assertThat(entity).isNotNull();
        assertThat(entity.getUser()).isSameAs(owner);
        assertThat(entity.getUser().getId()).isEqualTo(7L);
        assertThat(entity.getPasswordHash()).isEqualTo("rawPassword123");
        // The mapper does not generate an id; persistence assigns it later.
        assertThat(entity.getId()).isNull();
    }

    @Test
    @DisplayName("mapToEntity ignores the confirmPassword field and uses only the password value")
    void mapToEntity_withDifferingConfirmPassword_usesOnlyPassword() {
        // Arrange
        UserEntity owner = baseUser(1L, "owner");
        UserCredentialsDto dto = new UserCredentialsDto("primarySecret", "somethingElse");

        // Act
        UserCredentialsEntity entity = UserCredentialsMapper.mapToEntity(owner, dto);

        // Assert
        assertThat(entity.getPasswordHash()).isEqualTo("primarySecret");
        assertThat(entity.getPasswordHash()).isNotEqualTo("somethingElse");
        assertThat(entity.getUser()).isSameAs(owner);
    }

    @Test
    @DisplayName("mapToEntity copies a null password verbatim without substituting a default")
    void mapToEntity_withNullPassword_copiesNullHash() {
        // Arrange
        UserEntity owner = baseUser(2L, "owner");
        UserCredentialsDto dto = new UserCredentialsDto(null, null);

        // Act
        UserCredentialsEntity entity = UserCredentialsMapper.mapToEntity(owner, dto);

        // Assert
        assertThat(entity.getPasswordHash()).isNull();
        assertThat(entity.getUser()).isSameAs(owner);
    }

    @Test
    @DisplayName("mapFromEntity returns null when the source entity is null")
    void mapFromEntity_whenEntityIsNull_returnsNull() {
        // Act
        UserCredentialsDto dto = UserCredentialsMapper.mapFromEntity(null);

        // Assert
        assertThat(dto).isNull();
    }

    @Test
    @DisplayName("mapFromEntity copies the stored hash into both the password and confirmPassword fields")
    void mapFromEntity_withCredentials_mapsHashIntoBothPasswordFields() {
        // Arrange
        UserEntity owner = baseUser(5L, "employee");
        UserCredentialsEntity entity = new UserCredentialsEntity(owner, "$2a$10$storedBcryptHash");

        // Act
        UserCredentialsDto dto = UserCredentialsMapper.mapFromEntity(entity);

        // Assert
        assertThat(dto).isNotNull();
        assertThat(dto.getPassword()).isEqualTo("$2a$10$storedBcryptHash");
        assertThat(dto.getConfirmPassword()).isEqualTo("$2a$10$storedBcryptHash");
    }

    @Test
    @DisplayName("mapToEntity then mapFromEntity round-trips the password value through both DTO fields")
    void mapToEntity_thenMapFromEntity_roundTripsPassword() {
        // Arrange
        UserEntity owner = baseUser(3L, "roundtrip");
        UserCredentialsDto sourceDto = new UserCredentialsDto("roundTripPass", "roundTripPass");

        // Act
        UserCredentialsEntity entity = UserCredentialsMapper.mapToEntity(owner, sourceDto);
        UserCredentialsDto resultDto = UserCredentialsMapper.mapFromEntity(entity);

        // Assert
        assertThat(resultDto).isNotNull();
        assertThat(resultDto.getPassword()).isEqualTo("roundTripPass");
        assertThat(resultDto.getConfirmPassword()).isEqualTo("roundTripPass");
    }
}
