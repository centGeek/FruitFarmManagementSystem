package fruit.farm.management.service;

import fruit.farm.management.dto.AdminUserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.IncorrectInputFormatException;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.mapper.AdminUserMapper;
import fruit.farm.management.repository.RoleRepository;
import fruit.farm.management.repository.UserCredentialsRepository;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class AdminUserService {

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private UserCredentialsRepository userCredentialsRepository;
    private UserService userService;

    public List<AdminUserDto> getAllUsers() {

        return userRepository.getAllUsers().stream()
                .map(this::toDto)
                .toList();
    }

    public List<String> getAllRoles() {

        return roleRepository.findAll().stream()
                .map(RoleEntity::getRoleName)
                .toList();
    }

    @Transactional
    public AdminUserDto setActive(Long id, boolean active) {

        UserEntity user = findUserOrThrow(id);
        assertNotSelf(id, "Nie możesz zmienić statusu własnego konta");

        user.setActive(active);
        UserEntity saved = userRepository.save(user);
        log.info("Admin set isActive={} for user {}", active, id);
        return toDto(saved);
    }

    @Transactional
    public AdminUserDto changeRole(Long id, String roleName) {

        UserEntity user = findUserOrThrow(id);
        assertNotSelf(id, "Nie możesz zmienić roli własnego konta");

        RoleEntity role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new IncorrectInputFormatException(
                        String.format("Rola '%s' nie istnieje", roleName)));

        user.setRole(role);
        UserEntity saved = userRepository.save(user);
        log.info("Admin changed role of user {} to {}", id, roleName);
        return toDto(saved);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {

        UserEntity user = findUserOrThrow(id);
        if (newPassword == null || newPassword.length() < 6) {
            throw new IncorrectInputFormatException("Hasło musi mieć co najmniej 6 znaków");
        }

        userCredentialsRepository.update(new UserCredentialsEntity(user, newPassword));
        log.info("Admin reset password for user {}", id);
    }

    private AdminUserDto toDto(UserEntity user) {

        long employeeCount = isGardener(user) ? userRepository.countEmployees(user.getId()) : 0;
        return AdminUserMapper.mapFromEntity(user, employeeCount);
    }

    private boolean isGardener(UserEntity user) {

        return user.getRole() != null
                && RoleType.GARDENER.getDisplayName().equals(user.getRole().getRoleName());
    }

    private UserEntity findUserOrThrow(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        String.format("Użytkownik o id %d nie istnieje", id)));
    }

    private void assertNotSelf(Long id, String message) {

        if (id.equals(userService.getLoggedUser().getId())) {
            throw new IncorrectInputFormatException(message);
        }
    }
}
