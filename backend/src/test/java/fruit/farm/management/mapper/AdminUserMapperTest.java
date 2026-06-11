package fruit.farm.management.mapper;

import fruit.farm.management.dto.AdminUserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AdminUserMapper.mapFromEntity")
class AdminUserMapperTest {

    private UserEntity user(String roleName, UserEntity gardener) {
        UserEntity user = new UserEntity();
        user.setId(10L);
        user.setName("John");
        user.setSurname("Apple");
        user.setNickname("johnny");
        user.setEmail("john@example.com");
        user.setPhoneNumber("123456789");
        user.setActive(true);
        user.setCreationDate(LocalDate.of(2026, 1, 1));
        user.setLocalityName("Warsaw");
        user.setRole(new RoleEntity(2L, roleName));
        user.setGardener(gardener);
        return user;
    }

    @Test
    @DisplayName("maps core fields and role name for a gardener with no owner")
    void mapFromEntity_gardener_mapsCoreFieldsAndEmployeeCount() {
        AdminUserDto dto = AdminUserMapper.mapFromEntity(user("Gardener", null), 4);

        assertThat(dto.getId()).isEqualTo(10L);
        assertThat(dto.getNickname()).isEqualTo("johnny");
        assertThat(dto.getRoleName()).isEqualTo("Gardener");
        assertThat(dto.isActive()).isTrue();
        assertThat(dto.getEmployeeCount()).isEqualTo(4);
        assertThat(dto.getGardenerId()).isNull();
        assertThat(dto.getGardenerName()).isNull();
    }

    @Test
    @DisplayName("maps the owning gardener id and name for an employee")
    void mapFromEntity_employee_mapsOwningGardener() {
        UserEntity gardener = new UserEntity();
        gardener.setId(99L);
        gardener.setName("Anna");
        gardener.setSurname("Owner");

        AdminUserDto dto = AdminUserMapper.mapFromEntity(user("Employee", gardener), 0);

        assertThat(dto.getRoleName()).isEqualTo("Employee");
        assertThat(dto.getGardenerId()).isEqualTo(99L);
        assertThat(dto.getGardenerName()).isEqualTo("Anna Owner");
        assertThat(dto.getEmployeeCount()).isZero();
    }

    @Test
    @DisplayName("tolerates a null role")
    void mapFromEntity_nullRole_mapsNullRoleName() {
        UserEntity user = user("Gardener", null);
        user.setRole(null);

        AdminUserDto dto = AdminUserMapper.mapFromEntity(user, 0);

        assertThat(dto.getRoleName()).isNull();
    }
}
