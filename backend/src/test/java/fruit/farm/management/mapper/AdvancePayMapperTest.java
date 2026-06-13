package fruit.farm.management.mapper;

import fruit.farm.management.dto.AdvancePayDto;
import fruit.farm.management.entity.AdvancePayEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AdvancePayMapper")
class AdvancePayMapperTest {

    private AdvancePayEntity baseEntity(UserEntity user) {
        AdvancePayEntity entity = new AdvancePayEntity();
        entity.setId(42L);
        entity.setUser(user);
        entity.setAmount(new BigDecimal("250.50"));
        entity.setDescription("Zaliczka na materiały");
        entity.setCreatedAt(LocalDate.of(2026, 6, 11));
        entity.setSettled(true);
        return entity;
    }

    private UserEntity owner(long id) {
        UserEntity user = new UserEntity();
        user.setId(id);
        return user;
    }

    @Test
    @DisplayName("mapToDTO copies all fields and flattens the owner to a userId")
    void mapToDTO_withFullEntity_copiesAllFieldsAndOwnerId() {
        // Arrange
        AdvancePayEntity entity = baseEntity(owner(7L));

        // Act
        AdvancePayDto dto = AdvancePayMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getUserId()).isEqualTo(7L);
        assertThat(dto.getAmount()).isEqualByComparingTo("250.50");
        assertThat(dto.getDescription()).isEqualTo("Zaliczka na materiały");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDate.of(2026, 6, 11));
        assertThat(dto.isSettled()).isTrue();
    }

    @Test
    @DisplayName("mapToDTO preserves a false settled flag")
    void mapToDTO_whenNotSettled_preservesFalseFlag() {
        // Arrange
        AdvancePayEntity entity = baseEntity(owner(3L));
        entity.setSettled(false);

        // Act
        AdvancePayDto dto = AdvancePayMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.isSettled()).isFalse();
        assertThat(dto.getUserId()).isEqualTo(3L);
    }

    @Test
    @DisplayName("mapToDTO passes through a null description without failing")
    void mapToDTO_whenDescriptionNull_keepsNull() {
        // Arrange
        AdvancePayEntity entity = baseEntity(owner(5L));
        entity.setDescription(null);

        // Act
        AdvancePayDto dto = AdvancePayMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getDescription()).isNull();
        assertThat(dto.getAmount()).isEqualByComparingTo("250.50");
    }

    @Test
    @DisplayName("mapToDTO maps a zero amount, compared via isEqualByComparingTo")
    void mapToDTO_whenZeroAmount_mapsZero() {
        // Arrange
        AdvancePayEntity entity = baseEntity(owner(9L));
        entity.setAmount(new BigDecimal("0.00"));

        // Act
        AdvancePayDto dto = AdvancePayMapper.mapToDTO(entity);

        // Assert
        assertThat(dto.getAmount()).isEqualByComparingTo("0.00");
    }
}
