package fruit.farm.management.controller;

import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
@Slf4j
public class EmployeeController {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<UserEntity>> fetchListOfEmployees(@RequestParam(required = false) String status) {

        log.info("Getting list of users with status filter: {}", status);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            System.out.println("Logged user:" + loggedInEmail);
            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<UserEntity> users = userRepository.getAllEmployees(gardener.getId());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<UserEntity>> fetchActiveUsers() {
        log.info("Getting list of active users");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<UserEntity> users = userRepository.getAllActiveEmployees(gardener.getId());
            log.info("Found {} active users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching active users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/archived")
    public ResponseEntity<List<UserEntity>> fetchArchivedUsers() {
        log.info("Getting list of archived users");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<UserEntity> users = userRepository.getAllArchivedEmployees(gardener.getId());
            log.info("Found {} archived users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching archived users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody UserDTO userRequest) {
        log.info("Attempting to register user with email: {}", userRequest.getEmail());
        log.info("Request body: {}", userRequest);

        try {
            Optional<UserEntity> existingUser = userRepository.findByEmail(userRequest.getEmail());
            if (existingUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Użytkownik z tym adresem email już istnieje"));
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            log.info("User registration data received:");
            log.info("Name: {}", userRequest.getName());
            log.info("Surname: {}", userRequest.getSurname());
            log.info("Email: {}", userRequest.getEmail());
            log.info("Phone: {}", userRequest.getPhoneNumber());
            log.info("Nickname: {}", userRequest.getNickname());
            log.info("IsActive: {}", userRequest.isActive());

            UserEntity userEntity = UserMapper.mapToEntity(userRequest, gardener);
            userEntity.setCreationDate(LocalDate.now());
            UserEntity savedUser = userRepository.save(userEntity);

            return ResponseEntity.ok(Map.of(
                    "message", "User registered successfully",
                    "email", userRequest.getEmail(),
                    "id", savedUser.getId().toString()
            ));

        } catch (Exception e) {
            log.error("Error registering user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> updateUser(@PathVariable Long id, @RequestBody UserEntity userRequest) {
        log.info("Attempting to update user with ID: {}", id);
        log.info("Update request body: {}", userRequest);

        try {
            Optional<UserEntity> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }

            UserEntity existingUser = optionalUser.get();

            if (userRequest.getEmail() != null && !userRequest.getEmail().equals(existingUser.getEmail())) {
                Optional<UserEntity> userWithEmail = userRepository.findByEmail(userRequest.getEmail());
                if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "Email already taken by another user"));
                }
            }

            log.info("User update data received:");
            log.info("ID: {}", id);
            log.info("Name: {}", userRequest.getName());
            log.info("Surname: {}", userRequest.getSurname());
            log.info("Email: {}", userRequest.getEmail());
            log.info("Phone: {}", userRequest.getPhoneNumber());
            log.info("Nickname: {}", userRequest.getNickname());
            log.info("IsActive: {}", userRequest.isActive());

            if (userRequest.getName() != null) {
                existingUser.setName(userRequest.getName());
            }
            if (userRequest.getSurname() != null) {
                existingUser.setSurname(userRequest.getSurname());
            }
            if (userRequest.getEmail() != null) {
                existingUser.setEmail(userRequest.getEmail());
            }
            if (userRequest.getPhoneNumber() != null) {
                existingUser.setPhoneNumber(userRequest.getPhoneNumber());
            }
            if (userRequest.getNickname() != null) {
                existingUser.setNickname(userRequest.getNickname());
            }
            if (userRequest.getPassword() != null && !userRequest.getPassword().trim().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
                log.info("Password updated for user ID: {}", id);
            }
            existingUser.setActive(userRequest.isActive());

            UserEntity updatedUser = userRepository.save(existingUser);
            log.info("User updated successfully with ID: {}", updatedUser.getId());

            return ResponseEntity.ok(Map.of(
                    "message", "User updated successfully",
                    "id", id.toString(),
                    "email", updatedUser.getEmail()
            ));

        } catch (Exception e) {
            log.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<Map<String, String>> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> statusRequest) {
        log.info("Attempting to toggle status for user ID: {}", id);
        log.info("Status request: {}", statusRequest);

        try {
            Optional<UserEntity> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }

            UserEntity user = optionalUser.get();

            Boolean newStatus = statusRequest.get("active");
            if (newStatus == null) {
                newStatus = statusRequest.get("isActive");
            }
            if (newStatus == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Missing 'active' or 'isActive' field in request"));
            }

            log.info("Changing user {} status from {} to {}",
                    user.getEmail(), user.isActive(), newStatus);

            user.setActive(newStatus);
            UserEntity updatedUser = userRepository.save(user);

            String action = newStatus ? "activated" : "archived";
            log.info("User {} successfully {}", user.getEmail(), action);

            return ResponseEntity.ok(Map.of(
                    "message", "User status updated successfully",
                    "id", id.toString(),
                    "email", updatedUser.getEmail(),
                    "newStatus", newStatus.toString(),
                    "action", action
            ));

        } catch (Exception e) {
            log.error("Error toggling user status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Status update failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        log.info("Attempting to delete user with ID: {}", id);

        try {
            Optional<UserEntity> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }

            UserEntity user = optionalUser.get();
            String userEmail = user.getEmail();

            userRepository.delete(user);
            log.info("User {} deleted successfully", userEmail);

            return ResponseEntity.ok(Map.of(
                    "message", "User deleted successfully",
                    "id", id.toString(),
                    "email", userEmail
            ));

        } catch (Exception e) {
            log.error("Error deleting user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        log.info("Getting user by ID: {}", id);

        try {
            Optional<UserEntity> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }

            UserEntity user = optionalUser.get();
            log.info("Found user: {}", user.getEmail());

            return ResponseEntity.ok(user);

        } catch (Exception e) {
            log.error("Error getting user by ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get user: " + e.getMessage()));
        }
    }
}