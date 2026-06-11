package fruit.farm.management.service;

import fruit.farm.management.dto.AdminUserDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.IncorrectInputFormatException;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.repository.RoleRepository;
import fruit.farm.management.repository.UserCredentialsRepository;
import fruit.farm.management.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserService")
class AdminUserServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    RoleRepository roleRepository;

    @Mock
    UserCredentialsRepository userCredentialsRepository;

    @Mock
    UserService userService;

    @InjectMocks
    AdminUserService service;

    private void loggedInAs(long id) {
        UserDto current = new UserDto();
        current.setId(id);
        when(userService.getLoggedUser()).thenReturn(current);
    }

    @Captor
    ArgumentCaptor<UserCredentialsEntity> credentialsCaptor;

    private UserEntity user(long id, String roleName) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("John");
        user.setSurname("Apple");
        user.setNickname("johnny");
        user.setActive(true);
        user.setRole(new RoleEntity(2L, roleName));
        return user;
    }

    @Test
    @DisplayName("getAllUsers counts employees only for gardeners")
    void getAllUsers_countsEmployeesOnlyForGardeners() {
        UserEntity gardener = user(1L, "Gardener");
        UserEntity employee = user(2L, "Employee");
        when(userRepository.getAllUsers()).thenReturn(List.of(gardener, employee));
        when(userRepository.countEmployees(1L)).thenReturn(3L);

        List<AdminUserDto> result = service.getAllUsers();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEmployeeCount()).isEqualTo(3);
        assertThat(result.get(1).getEmployeeCount()).isZero();
        verify(userRepository, never()).countEmployees(2L);
    }

    @Test
    @DisplayName("setActive updates the flag and persists when not acting on self")
    void setActive_updatesFlagForOtherUser() {
        UserEntity target = user(5L, "Gardener");
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        loggedInAs(1L);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AdminUserDto result = service.setActive(5L, false);

        assertThat(result.isActive()).isFalse();
        assertThat(target.isActive()).isFalse();
        verify(userRepository).save(target);
    }

    @Test
    @DisplayName("setActive rejects acting on the admin's own account")
    void setActive_rejectsSelf() {
        UserEntity self = user(1L, "Admin");
        when(userRepository.findById(1L)).thenReturn(Optional.of(self));
        loggedInAs(1L);

        assertThatThrownBy(() -> service.setActive(1L, false))
                .isInstanceOf(IncorrectInputFormatException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("setActive throws NotFound for a missing user")
    void setActive_missingUser_throwsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.setActive(99L, true))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("changeRole assigns the resolved role")
    void changeRole_assignsResolvedRole() {
        UserEntity target = user(5L, "Employee");
        RoleEntity gardenerRole = new RoleEntity(2L, "Gardener");
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        loggedInAs(1L);
        when(roleRepository.findByRoleName("Gardener")).thenReturn(Optional.of(gardenerRole));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AdminUserDto result = service.changeRole(5L, "Gardener");

        assertThat(result.getRoleName()).isEqualTo("Gardener");
        assertThat(target.getRole()).isEqualTo(gardenerRole);
    }

    @Test
    @DisplayName("changeRole rejects an unknown role")
    void changeRole_unknownRole_throwsBadInput() {
        UserEntity target = user(5L, "Employee");
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        loggedInAs(1L);
        when(roleRepository.findByRoleName("Ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeRole(5L, "Ghost"))
                .isInstanceOf(IncorrectInputFormatException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword updates credentials with the new raw password")
    void resetPassword_updatesCredentials() {
        UserEntity target = user(5L, "Employee");
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));

        service.resetPassword(5L, "newpass123");

        verify(userCredentialsRepository).update(credentialsCaptor.capture());
        assertThat(credentialsCaptor.getValue().getUser()).isEqualTo(target);
        assertThat(credentialsCaptor.getValue().getPasswordHash()).isEqualTo("newpass123");
    }

    @Test
    @DisplayName("resetPassword rejects a password shorter than six characters")
    void resetPassword_shortPassword_throwsBadInput() {
        UserEntity target = user(5L, "Employee");
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> service.resetPassword(5L, "123"))
                .isInstanceOf(IncorrectInputFormatException.class);
        verify(userCredentialsRepository, never()).update(any());
    }
}
