package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.dto.UserCredentialsDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.entity.*;
import fruit.farm.management.exception.IncorrectInputFormatException;
import fruit.farm.management.exception.NicknameAlreadyExistsException;
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
        String loggedWithNickname = authentication.getName();

        return userRepository.findByNickname(loggedWithNickname)
                .orElseThrow(() -> {
                    log.error("Logged in user with nickname {} not found in database.", loggedWithNickname);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Zalogowany użytkownik nie istnieje w bazie danych.");
                });
    }

    public Optional<UserEntity> findById(long id) {

        return userRepository.findById(id);
    }

    public Optional<UserEntity> findByNickname(String loggedWithNickname) {

        return userRepository.findByNickname(loggedWithNickname);
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
    public UserEntity update(UserEntity existingUser, UserDTO userRequest) {

        if (userRequest.getNickname() != null && !userRequest.getNickname().equals(existingUser.getNickname())) {
            Optional<UserEntity> userWithNickname = this.findByNickname(userRequest.getNickname());
            if (userWithNickname.isPresent() && !userWithNickname.get().getId().equals(existingUser.getId())) {
                throw new NicknameAlreadyExistsException("Nazwa użytkownika już jest zajęta");
            }
        }

        log.info("User update data received:");
        log.info("ID: {}", userRequest.getId());
        log.info("Name: {}", userRequest.getName());
        log.info("Surname: {}", userRequest.getSurname());
        log.info("Nickname: {}", userRequest.getNickname());
        log.info("Phone: {}", userRequest.getPhoneNumber());
        log.info("Nickname: {}", userRequest.getNickname());
        log.info("IsActive: {}", userRequest.isActive());

        if (userRequest.getName() != null) {
            existingUser.setName(userRequest.getName());
        }
        if (userRequest.getSurname() != null) {
            existingUser.setSurname(userRequest.getSurname());
        }
        if (userRequest.getNickname() != null) {
            existingUser.setNickname(userRequest.getNickname());
        }
        if (userRequest.getPhoneNumber() != null) {
            existingUser.setPhoneNumber(userRequest.getPhoneNumber());
        }
        if (userRequest.getNickname() != null) {
            existingUser.setNickname(userRequest.getNickname());
        }
        if (userRequest.getEmail() != null) {
            existingUser.setEmail(userRequest.getEmail());
        }
        existingUser.setActive(userRequest.isActive());

        UserEntity savedUser = userRepository.save(existingUser);

        if (userRequest.getPassword() != null) {
            userCredentialsRepository.update(new UserCredentialsEntity(savedUser, userRequest.getPassword()));
        }
        UserEntity loggedInUserId = this.getLoggedUser();

        notificationService.addUserNotification(NotificationDTO.builder()
                .title("Zaktualizowano dane pracownika!")
                .message("Zaktualizowano dane pracownika: " + userRequest.getName() + " " + userRequest.getSurname())
                .createdAt(LocalDateTime.now())
                .userDTO(UserMapper.mapFromEntity(savedUser))
                .build(), savedUser.getId(), loggedInUserId);
        return savedUser;
    }

    @Transactional
    public UserEntity registerUser(UserDTO request) {
        Optional<UserEntity> existingUser = this.findByNickname(request.getNickname().toLowerCase());
        if (existingUser.isPresent()) {
            throw new NicknameAlreadyExistsException("Użytkownik z tą nazwą użytkownika już istnieje");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {

            throw new IncorrectInputFormatException("Imię jest wymagane");
        }
        if (request.getSurname() == null || request.getSurname().trim().isEmpty()) {

            throw new IncorrectInputFormatException("Nazwisko jest wymagane");
        }
        if (request.getNickname() == null) {

            throw new IncorrectInputFormatException("Nickname jest wymagany");
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
        log.info("New user registered: {}", savedUser.getNickname());
        savedUser.setCredentials(userCredentialsEntity);
        return savedUser;
    }
}
