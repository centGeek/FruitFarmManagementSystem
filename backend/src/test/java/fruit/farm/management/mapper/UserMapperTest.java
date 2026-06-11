package fruit.farm.management.mapper;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UserMapper")
class UserMapperTest {

    private UserEntity baseUser(long id, String nickname) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("John");
        user.setSurname("Doe");
        user.setNickname(nickname);
        user.setPhoneNumber("111-222-333");
        user.setEmail(nickname + "@orch.com");
        user.setCreationDate(LocalDate.of(2026, 1, 1));
        user.setActive(true);
        user.setLocalityName("Warsaw");
        return user;
    }

    private UserEntity userWithCredentials(String nickname, UserEntity gardener) {
        UserEntity user = baseUser(1L, nickname);
        user.setGardener(gardener);
        user.setCredentials(new UserCredentialsEntity(user, "$2a$10$bcryptHashShouldNeverLeak"));
        return user;
    }

    @Test
    @DisplayName("mapToEntity copies fields, maps coordinates and assigns the Employee role")
    void mapToEntity_copiesFieldsAndAssignsEmployeeRole() {
        UserDto dto = new UserDto();
        dto.setId(10L);
        dto.setName("Anna");
        dto.setSurname("Nowak");
        dto.setNickname("anna");
        dto.setPhoneNumber("999");
        dto.setEmail("anna@orch.com");
        dto.setActive(true);
        dto.setLocalityName("Krakow");
        dto.setCoordinateDTO(new CoordinateDto(50.0, 19.9));
        UserEntity gardener = baseUser(1L, "gardener");

        UserEntity entity = UserMapper.mapToEntity(dto, gardener);

        assertThat(entity.getId()).isEqualTo(10L);
        assertThat(entity.getName()).isEqualTo("Anna");
        assertThat(entity.getLocalityName()).isEqualTo("Krakow");
        assertThat(entity.getRole().getRoleName()).isEqualTo(RoleType.EMPLOYEE.getDisplayName());
        assertThat(entity.getGardener()).isSameAs(gardener);
        assertThat(entity.getCoordinateEntity()).isNotNull();
        assertThat(entity.getCoordinateEntity().getLatitude()).isEqualTo(50.0);
    }

    @Test
    @DisplayName("mapFromEntity returns a basic DTO when the user has no credentials")
    void mapFromEntity_whenNoCredentials_returnsBasicDto() {
        UserEntity user = baseUser(5L, "noauth");

        UserDto dto = UserMapper.mapFromEntity(user);

        assertThat(dto.getId()).isEqualTo(5L);
        assertThat(dto.getNickname()).isEqualTo("noauth");
        assertThat(dto.getEmail()).isEqualTo("noauth@orch.com");
        assertThat(dto.getLocalityName()).isEqualTo("Warsaw");
        assertThat(dto.getGardener()).isNull();
    }

    @Test
    @DisplayName("mapFromEntity nests the gardener DTO when credentials and a gardener are present")
    void mapFromEntity_whenGardenerPresent_nestsGardenerDto() {
        UserEntity gardener = baseUser(1L, "gardener");
        UserEntity employee = baseUser(7L, "employee");
        employee.setCredentials(new UserCredentialsEntity());
        employee.setGardener(gardener);

        UserDto dto = UserMapper.mapFromEntity(employee);

        assertThat(dto.getId()).isEqualTo(7L);
        assertThat(dto.getGardener()).isNotNull();
        assertThat(dto.getGardener().getId()).isEqualTo(1L);
        assertThat(dto.getGardener().getNickname()).isEqualTo("gardener");
    }

    @Test
    @DisplayName("mapFromEntity never exposes the password hash for a gardener (no owner)")
    void mapFromEntity_gardener_doesNotExposePasswordHash() {
        UserDto dto = UserMapper.mapFromEntity(userWithCredentials("gardener1", null));

        assertThat(dto.getPassword()).isNull();
        assertThat(dto.getConfirmPassword()).isNull();
        assertThat(dto.getNickname()).isEqualTo("gardener1");
    }

    @Test
    @DisplayName("mapFromEntity never exposes the password hash for an employee nor its nested gardener")
    void mapFromEntity_employee_doesNotExposePasswordHash() {
        UserEntity gardener = userWithCredentials("ownerGardener", null);
        UserDto dto = UserMapper.mapFromEntity(userWithCredentials("employee1", gardener));

        assertThat(dto.getPassword()).isNull();
        assertThat(dto.getConfirmPassword()).isNull();
        assertThat(dto.getGardener()).isNotNull();
        assertThat(dto.getGardener().getPassword()).isNull();
        assertThat(dto.getGardener().getConfirmPassword()).isNull();
    }
}
