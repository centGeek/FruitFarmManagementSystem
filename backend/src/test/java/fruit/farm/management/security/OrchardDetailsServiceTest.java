package fruit.farm.management.security;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrchardDetailsService")
class OrchardDetailsServiceTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    OrchardDetailsService service;

    private UserEntity userWithRole(String nickname, String roleName, boolean active) {
        UserEntity user = new UserEntity();
        user.setId(7L);
        user.setNickname(nickname);
        user.setActive(active);
        user.setRole(new RoleEntity(1L, roleName));
        user.setCredentials(new UserCredentialsEntity(user, "$2a$10$hashedpassword"));
        return user;
    }

    @Test
    @DisplayName("loadUserByUsername returns the matching UserDetails for an existing active user")
    void loadUserByUsername_whenUserExistsAndActive_returnsUserDetails() {
        // Arrange
        UserEntity user = userWithRole("gardener1", RoleType.GARDENER.getDisplayName(), true);
        when(userRepository.findByNickname("gardener1")).thenReturn(Optional.of(user));

        // Act
        UserDetails result = service.loadUserByUsername("gardener1");

        // Assert
        assertThat(result.getUsername()).isEqualTo("gardener1");
        assertThat(result.getPassword()).isEqualTo("$2a$10$hashedpassword");
        assertThat(result.isEnabled()).isTrue();
        assertThat(result.isAccountNonExpired()).isTrue();
        assertThat(result.isAccountNonLocked()).isTrue();
        assertThat(result.isCredentialsNonExpired()).isTrue();
    }

    @ParameterizedTest
    @EnumSource(RoleType.class)
    @DisplayName("loadUserByUsername maps the role display name into a single matching authority")
    void loadUserByUsername_whenUserHasRole_mapsRoleDisplayNameToAuthority(RoleType roleType) {
        // Arrange
        UserEntity user = userWithRole("user", roleType.getDisplayName(), true);
        when(userRepository.findByNickname("user")).thenReturn(Optional.of(user));

        // Act
        UserDetails result = service.loadUserByUsername("user");

        // Assert
        assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly(roleType.getDisplayName());
    }

    @Test
    @DisplayName("loadUserByUsername trims surrounding whitespace from the role name when building authorities")
    void loadUserByUsername_whenRoleNameHasWhitespace_trimsAuthority() {
        // Arrange
        UserEntity user = userWithRole("user", "  Gardener  ", true);
        when(userRepository.findByNickname("user")).thenReturn(Optional.of(user));

        // Act
        UserDetails result = service.loadUserByUsername("user");

        // Assert
        assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("Gardener");
    }

    @ParameterizedTest
    @EnumSource(value = RoleType.class, names = {"GARDENER", "EMPLOYEE"})
    @DisplayName("loadUserByUsername reflects the user active flag in the enabled property")
    void loadUserByUsername_whenUserActiveFlagSet_reflectsEnabled(RoleType roleType) {
        // Arrange: one active and one inactive user verified via the active flag mapping
        UserEntity activeUser = userWithRole("active", roleType.getDisplayName(), true);
        UserEntity inactiveUser = userWithRole("inactive", roleType.getDisplayName(), false);
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(activeUser));
        when(userRepository.findByNickname("inactive")).thenReturn(Optional.of(inactiveUser));

        // Act
        UserDetails active = service.loadUserByUsername("active");
        UserDetails inactive = service.loadUserByUsername("inactive");

        // Assert
        assertThat(active.isEnabled()).isTrue();
        assertThat(inactive.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("loadUserByUsername disables the account when the user is inactive but leaves other status flags enabled")
    void loadUserByUsername_whenUserInactive_disablesOnlyEnabledFlag() {
        // Arrange
        UserEntity user = userWithRole("blocked", RoleType.EMPLOYEE.getDisplayName(), false);
        when(userRepository.findByNickname("blocked")).thenReturn(Optional.of(user));

        // Act
        UserDetails result = service.loadUserByUsername("blocked");

        // Assert
        assertThat(result.isEnabled()).isFalse();
        assertThat(result.isAccountNonExpired()).isTrue();
        assertThat(result.isAccountNonLocked()).isTrue();
        assertThat(result.isCredentialsNonExpired()).isTrue();
    }

    @Test
    @DisplayName("loadUserByUsername throws UsernameNotFoundException naming the nickname when the user does not exist")
    void loadUserByUsername_whenUserMissing_throwsUsernameNotFound() {
        // Arrange
        when(userRepository.findByNickname("ghost")).thenReturn(Optional.empty());

        // Act / Assert
        assertThatThrownBy(() -> service.loadUserByUsername("ghost"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("ghost");
    }

    @Test
    @DisplayName("loadUserByUsername throws UsernameNotFoundException when the user has no role assigned")
    void loadUserByUsername_whenRoleIsNull_throwsUsernameNotFound() {
        // Arrange
        UserEntity user = userWithRole("noRole", "ignored", true);
        user.setRole(null);
        when(userRepository.findByNickname("noRole")).thenReturn(Optional.of(user));

        // Act / Assert
        assertThatThrownBy(() -> service.loadUserByUsername("noRole"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("no role assigned");
    }
}
