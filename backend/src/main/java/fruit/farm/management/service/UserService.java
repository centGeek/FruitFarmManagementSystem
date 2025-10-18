package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.entity.NotificationType;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class UserService {

    private UserRepository userRepository;
    private NotificationService notificationService;
    public UserEntity getLoggedInUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInEmail = authentication.getName();

        return userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> {
                    log.error("Logged in user with email {} not found in database.", loggedInEmail);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Zalogowany użytkownik nie istnieje w bazie danych.");
                });
    }

    public Optional<UserEntity> findById(long id) {

        return userRepository.findById(id);
    }

    public Optional<UserEntity> findByEmail(String loggedInEmail) {

        return userRepository.findByEmail(loggedInEmail);
    }

    public List<UserEntity> getAllEmployees(Long id) {

        return userRepository.getAllEmployees(id);
    }

    public List<UserEntity> getAllActiveEmployees(Long id) {

        return userRepository.getAllActiveEmployees(id);
    }

    public List<UserEntity> getAllArchivedEmployees(Long id) {

        return userRepository.getAllArchivedEmployees(id);
    }

    public void delete(UserEntity userEntity) {

        userRepository.delete(userEntity);
    }
    @Transactional
    public UserEntity save(UserEntity user) {

        UserEntity savedUser = userRepository.save(user);
        UserEntity loggedInUserId = this.getLoggedInUserId();
        notificationService.addUserNotification(NotificationDTO.builder()
                        .title("Dodano nowego pracownika!")
                        .message("Dodano pracownika: " + user.getName() + " " + user.getSurname())
                        .createdAt(LocalDateTime.now())
                        .userDTO(UserMapper.mapFromEntity(savedUser))
                .build(), savedUser.getId(), loggedInUserId);
        return savedUser;
    }
}
