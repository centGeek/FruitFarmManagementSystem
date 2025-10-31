package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.dto.UserCredentialsDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.entity.*;
import fruit.farm.management.exception.EmailAlreadyExistsException;
import fruit.farm.management.exception.IncorrectInputFormatException;
import fruit.farm.management.mapper.CoordinateMapper;
import fruit.farm.management.mapper.UserCredentialsMapper;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.CoordinateRepository;
import fruit.farm.management.repository.RoleRepository;
import fruit.farm.management.repository.UserCredentialsRepository;
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
    private WorkDetailsService workDetailsService;
    private RoleRepository roleRepository;
    private CoordinateRepository coordinateRepository;
    private UserCredentialsRepository userCredentialsRepository;

    public UserEntity getLoggedUser() {
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

    public List<UserDTO> getAllEmployees(Long id) {

        return userRepository.getAllEmployees(id).stream()
                .map(UserMapper::mapFromEntity).toList();
    }

    public List<UserDTO> getAllActiveEmployees(Long id) {

        return userRepository.getAllActiveEmployees(id).stream()
                .map(UserMapper::mapFromEntity).toList();
    }

    public List<UserDTO> getAllArchivedEmployees(Long id) {

        return userRepository.getAllArchivedEmployees(id).stream()
                .map(UserMapper::mapFromEntity).toList();
    }

    public void delete(UserEntity userEntity) {

        userRepository.delete(userEntity);
    }

    @Transactional
    public UserEntity save(UserEntity user) {
        Optional<WorkDetailsEntity> workDetailsEntity = workDetailsService.getLatestWorkDetailsByGardener(user.getGardener().getId());

        UserEntity savedUser = userRepository.save(user);
        if (workDetailsEntity.isPresent()) {
            WorkDetailsEntity workDetails = workDetailsEntity.get();
            workDetailsService.createWorkDetails(new WorkDetailsDTO(
                    workDetails.getIsPaidHourly(), workDetails.getHourlyPay(), workDetails.getPayPerKilogram(),
                    workDetails.getCreatedAt(),
                    UserMapper.mapFromEntity(user)));
        }
        UserEntity loggedInUserId = this.getLoggedUser();
        notificationService.addUserNotification(NotificationDTO.builder()
                .title("Dodano nowego pracownika!")
                .message("Dodano pracownika: " + user.getName() + " " + user.getSurname())
                .createdAt(LocalDateTime.now())
                .userDTO(UserMapper.mapFromEntity(savedUser))
                .build(), savedUser.getId(), loggedInUserId);

        return savedUser;
    }

    @Transactional
    public UserEntity saveGardener(UserEntity user) {

        return userRepository.save(user);
    }

    @Transactional
    public UserEntity update(UserEntity user, String password) {
        UserEntity savedUser = userRepository.save(user);

        if (password != null) {
            userCredentialsRepository.update(new UserCredentialsEntity(savedUser, password));
        }
        UserEntity loggedInUserId = this.getLoggedUser();

        notificationService.addUserNotification(NotificationDTO.builder()
                .title("Zaktualizowano dane pracownika!")
                .message("Zaktualizowano dane pracownika: " + user.getName() + " " + user.getSurname())
                .createdAt(LocalDateTime.now())
                .userDTO(UserMapper.mapFromEntity(savedUser))
                .build(), savedUser.getId(), loggedInUserId);
        return savedUser;
    }

    @Transactional
    public UserEntity registerUser(UserDTO request) {
        Optional<UserEntity> existingUser = this.findByEmail(request.getEmail().toLowerCase());
        if (existingUser.isPresent()) {
            throw new EmailAlreadyExistsException("Użytkownik z tym adresem email już istnieje");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {

            throw new IncorrectInputFormatException("Imię jest wymagane");
        }
        if (request.getSurname() == null || request.getSurname().trim().isEmpty()) {

            throw new IncorrectInputFormatException("Nazwisko jest wymagane");
        }
        if (request.getEmail() == null || !request.getEmail().matches("\\S+@\\S+\\.\\S+")) {

            throw new IncorrectInputFormatException("Email nie spełnia wymagań");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {

            throw new IncorrectInputFormatException("Hasło musi mieć co najmniej 6 znaków");
        }

        RoleEntity defaultRole = roleRepository.findByRoleName("Gardener")
                .orElseThrow(() -> new RuntimeException("Domyślna rola nie została znaleziona"));

        CoordinateEntity coordinateEntity = coordinateRepository.addCoordinate(
                CoordinateMapper.mapToEntity(request.getCoordinateDTO(), null)
        );
        UserEntity newUser = new UserEntity(
                request.getName().trim(),
                request.getSurname().trim(),
                request.getNickname() != null ? request.getNickname().trim() : null,
                request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null,
                request.getEmail().toLowerCase().trim(),
                LocalDate.now(),
                defaultRole,
                true,
                null,
                coordinateEntity,
                request.getLocalityName(),
                null
        );
        UserEntity savedUser = this.saveGardener(newUser);

        UserCredentialsEntity userCredentialsEntity = UserCredentialsMapper.mapToEntity(
                savedUser, new UserCredentialsDTO(request.getPassword(), request.getConfirmPassword()));
        userCredentialsRepository.save(userCredentialsEntity);
        log.info("New user registered: {}", savedUser.getEmail());
        savedUser.setCredentials(userCredentialsEntity);
        return savedUser;
    }
}
