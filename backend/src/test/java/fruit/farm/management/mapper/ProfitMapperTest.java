package fruit.farm.management.mapper;

import fruit.farm.management.dto.ProfitDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.ProfitType;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ProfitMapper")
class ProfitMapperTest {

    @Test
    @DisplayName("mapToEntity copies fields, maps the owner and leaves sector null when DTO has none")
    void mapToEntity_withoutSector_copiesFieldsAndMapsOwner() {
        UserDto owner = new UserDto();
        owner.setId(8L);
        ProfitDto dto = new ProfitDto(null, LocalDate.of(2026, 6, 11), ProfitType.SPRZEDAZ_JABLEK,
                300L, new BigDecimal("2500.00"), "Apple harvest sale", true, 8L, null);

        ProfitEntity entity = ProfitMapper.mapToEntity(dto, owner);

        assertThat(entity.getProfitType()).isEqualTo(ProfitType.SPRZEDAZ_JABLEK);
        assertThat(entity.getKilogramsSold()).isEqualTo(300L);
        assertThat(entity.getProfit()).isEqualByComparingTo("2500.00");
        assertThat(entity.getDescription()).isEqualTo("Apple harvest sale");
        assertThat(entity.isReceived()).isTrue();
        assertThat(entity.getSectorEntity()).isNull();
        assertThat(entity.getUserEntity()).isNotNull();
        assertThat(entity.getUserEntity().getId()).isEqualTo(8L);
    }

    @Test
    @DisplayName("mapFromEntity copies fields and flattens the owner to a userId")
    void mapFromEntity_withoutSector_copiesFieldsAndOwnerId() {
        UserEntity owner = new UserEntity();
        owner.setId(9L);
        ProfitEntity entity = new ProfitEntity(ProfitType.SPRZEDAZ_GRUSZEK, 150L,
                new BigDecimal("900.00"), "Pear sale", LocalDate.of(2026, 4, 2), false, owner, null);
        entity.setPurchaseId(77L);

        ProfitDto dto = ProfitMapper.mapFromEntity(entity);

        assertThat(dto.getPurchaseId()).isEqualTo(77L);
        assertThat(dto.getProfitType()).isEqualTo(ProfitType.SPRZEDAZ_GRUSZEK);
        assertThat(dto.getKilogramsSold()).isEqualTo(150L);
        assertThat(dto.getProfit()).isEqualByComparingTo("900.00");
        assertThat(dto.isReceived()).isFalse();
        assertThat(dto.getUserId()).isEqualTo(9L);
        assertThat(dto.getSectorDTO()).isNull();
    }
}
