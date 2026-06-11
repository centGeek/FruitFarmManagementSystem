package fruit.farm.management.repository;

import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.jpa.UserJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class UserRepository {

    private UserJpaRepository userJpaRepository;

    public List<UserEntity> getAllExceptLoggedUser() {

        Long loggedUserId = getCurrentUserId();
        List<UserEntity> users = userJpaRepository.findAll();

        users.removeIf(user -> user.getId().equals(loggedUserId));

        return users;
    }

    public void delete(UserEntity userEntity) {

        userEntity.setActive(true);
        userJpaRepository.delete(userEntity);
    }

    public List<UserEntity> getAllUsersByRoleName(String roleName) {

        return userJpaRepository.getAllUsersByRoleName(roleName);
    }

    public List<UserEntity> getAllEmployees(long gardenerId) {

        return userJpaRepository.getAllEmployees(gardenerId);
    }

    public List<UserEntity> getAllArchivedEmployees(long gardenerId) {

        return userJpaRepository.getAllArchivedEmployees(gardenerId);
    }

    public List<UserEntity> getAllActiveEmployees(long gardenerId) {

        return userJpaRepository.getAllActiveEmployees(gardenerId);
    }

    public List<UserEntity> getAllUsers() {

        return userJpaRepository.getAll();
    }

    public UserEntity save(UserEntity userEntity) {

        return userJpaRepository.save(userEntity);
    }

    public Optional<UserEntity> findByNickname(String nickname) {

        return userJpaRepository.findByNickname(nickname);
    }

    public Long getCurrentUserId() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            String username = userDetails.getUsername();
            UserEntity dbUser = userJpaRepository.findByNickname(username).get();
            return dbUser.getId();
        }
        throw new IllegalStateException("Unsupported principal type: " + principal.getClass());
    }

    public Optional<UserEntity> findById(Long id) {
        return userJpaRepository.findById(id);
    }

    public long countEmployees(long gardenerId) {

        return userJpaRepository.countByGardenerId(gardenerId);
    }

}