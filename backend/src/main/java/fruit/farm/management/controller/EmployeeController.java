package fruit.farm.management.controller;

import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NicknameAlreadyExistsException;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.service.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> fetchListOfEmployees(@RequestParam(required = false) String status) {

        log.info("Getting list of users with status filter: {}", status);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedWithNickname = authentication.getName();
            System.out.println("Logged user:" + loggedWithNickname);
            UserEntity gardener = userService.findByNickname(loggedWithNickname)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<UserDTO> users = userService.getAllEmployees(gardener.getId());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<UserDTO>> fetchActiveUsers() {

        log.info("Getting list of active users");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedWithNickname = authentication.getName();
            UserEntity gardener = userService.findByNickname(loggedWithNickname)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<UserDTO> users = userService.getAllActiveEmployees(gardener.getId());
            log.info("Found {} active users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching active users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/archived")
    public ResponseEntity<List<UserDTO>> fetchArchivedUsers() {

        log.info("Getting list of archived users");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInNickname = authentication.getName();
            UserEntity gardener = userService.findByNickname(loggedInNickname)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<UserDTO> users = userService.getAllArchivedEmployees(gardener.getId());
            log.info("Found {} archived users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching archived users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody UserDTO userRequest) {

        log.info("Attempting to register user with nickname: {}", userRequest.getNickname());

        try {
            Optional<UserEntity> existingUser = userService.findByNickname(userRequest.getNickname());
            if (existingUser.isPresent()) {
                throw new NicknameAlreadyExistsException ("Użytkownik z tą nazwą użytkownika już istnieje");
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInNickname = authentication.getName();
            UserEntity gardener = userService.findByNickname(loggedInNickname)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));


            UserEntity userEntity = UserMapper.mapToEntity(userRequest, gardener);
            userEntity.setCreationDate(LocalDate.now());
            UserEntity savedUser = userService.save(userEntity);
            return ResponseEntity.ok(Map.of(
                    "message", "User registered successfully",
                    "nickname", userRequest.getNickname(),
                    "id", savedUser.getId().toString()
            ));

        } catch (Exception e) {
            log.error("Error registering user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Błąd rejestracji: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> updateUser(@PathVariable Long id, @RequestBody UserDTO userRequest) {
        log.info("Attempting to update user with ID: {}", id);
        log.info("Update request body: {}", userRequest);

        try {
            Optional<UserEntity> optionalUser = userService.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }

            UserEntity existingUser = optionalUser.get();

            UserEntity updatedUser = userService.update(existingUser, userRequest);
            log.info("User updated successfully with ID: {}", updatedUser.getId());

            return ResponseEntity.ok(Map.of(
                    "message", "User updated successfully",
                    "id", id.toString(),
                    "nickname", updatedUser.getNickname()
            ));

        } catch (Exception e) {
            log.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        log.info("Attempting to delete user with ID: {}", id);

        try {
            Optional<UserEntity> optionalUser = userService.findById(id);
            if (optionalUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }
            UserEntity userEntity = optionalUser.get();
            String userNickname = userEntity.getNickname();

            userService.delete(userEntity);
            log.info("User {} deleted successfully", userNickname);

            return ResponseEntity.ok(Map.of(
                    "message", "User deleted successfully",
                    "id", id.toString(),
                    "nickname", userNickname
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
            Optional<UserEntity> optionalUser = userService.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found with ID: " + id));
            }

            UserEntity user = optionalUser.get();
            log.info("Found user: {}", user.getNickname());

            return ResponseEntity.ok(user);

        } catch (Exception e) {
            log.error("Error getting user by ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get user: " + e.getMessage()));
        }
    }
}