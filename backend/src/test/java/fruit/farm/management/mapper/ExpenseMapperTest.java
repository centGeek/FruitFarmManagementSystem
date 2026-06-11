package fruit.farm.management.mapper;

import fruit.farm.management.dto.ExpenseDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.ProductType;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ExpenseMapper")
class ExpenseMapperTest {

    @Test
    @DisplayName("mapToEntity copies fields, maps the owner and leaves sector null when DTO has none")
    void mapToEntity_withoutSector_copiesFieldsAndMapsOwner() {
        UserDto owner = new UserDto();
        owner.setId(7L);
        ExpenseDto dto = new ExpenseDto(null, ProductType.PALIWO, new BigDecimal("349.90"),
                LocalDate.of(2026, 6, 11), "Diesel for the tractor", true, 7L, null);

        ExpenseEntity entity = ExpenseMapper.mapToEntity(dto, owner);

        assertThat(entity.getProductType()).isEqualTo(ProductType.PALIWO);
        assertThat(entity.getExpenseCost()).isEqualByComparingTo("349.90");
        assertThat(entity.getDescription()).isEqualTo("Diesel for the tractor");
        assertThat(entity.getCreatedAt()).isEqualTo(LocalDate.of(2026, 6, 11));
        assertThat(entity.isPaid()).isTrue();
        assertThat(entity.getSectorEntity()).isNull();
        assertThat(entity.getUserEntity()).isNotNull();
        assertThat(entity.getUserEntity().getId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("mapFromEntity copies fields and flattens the owner to a userId")
    void mapFromEntity_withoutSector_copiesFieldsAndOwnerId() {
        UserEntity owner = new UserEntity();
        owner.setId(5L);
        ExpenseEntity entity = new ExpenseEntity(ProductType.NAWOZY, new BigDecimal("120.00"),
                "Nitrogen fertilizer", LocalDate.of(2026, 5, 1), owner, false, null);

        ExpenseDto dto = ExpenseMapper.mapFromEntity(entity);

        assertThat(dto.getType()).isEqualTo(ProductType.NAWOZY);
        assertThat(dto.getAmount()).isEqualByComparingTo("120.00");
        assertThat(dto.getDescription()).isEqualTo("Nitrogen fertilizer");
        assertThat(dto.getCreatedAt()).isEqualTo(LocalDate.of(2026, 5, 1));
        assertThat(dto.isPaid()).isFalse();
        assertThat(dto.getUserId()).isEqualTo(5L);
        assertThat(dto.getSectorDTO()).isNull();
    }
}
