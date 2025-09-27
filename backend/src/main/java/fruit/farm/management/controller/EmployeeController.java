package fruit.farm.management.controller;

import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.security.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
@Slf4j
public class EmployeeController {

    private UserRepository userRepository;

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
            log.info("Found {} active users", users);
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInEmail = authentication.getName();
        UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        try {
            log.info("User registration data received:");
            log.info("Name: {}", userRequest.getName());
            log.info("Surname: {}", userRequest.getSurname());
            log.info("Email: {}", userRequest.getEmail());
            log.info("Phone: {}", userRequest.getPhoneNumber());
            log.info("Nickname: {}", userRequest.getNickname());
            log.info("IsActive: {}", userRequest.isActive());
            UserEntity userEntity = UserMapper.userDTOToEmployeeUserEntity(userRequest, gardener);
            userRepository.save(userEntity);

            return ResponseEntity.ok(Map.of(
                    "message", "User registered successfully",
                    "email", userRequest.getEmail()
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
            log.info("User update data received:");
            log.info("ID: {}", id);
            log.info("Name: {}", userRequest.getName());
            log.info("Surname: {}", userRequest.getSurname());
            log.info("Email: {}", userRequest.getEmail());
            log.info("Phone: {}", userRequest.getPhoneNumber());
            log.info("Nickname: {}", userRequest.getNickname());
            log.info("IsActive: {}", userRequest.isActive());

            // TODO: Add actual user update logic here

            return ResponseEntity.ok(Map.of(
                    "message", "User updated successfully",
                    "id", id.toString()
            ));

        } catch (Exception e) {
            log.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> statusRequest) {
        log.info("Attempting to toggle status for user ID: {}", id);
        log.info("New status: {}", statusRequest.get("isActive"));

        try {
            Boolean newStatus = statusRequest.get("isActive");

            // TODO: Add actual status toggle logic here

            return ResponseEntity.ok(Map.of(
                    "message", "User status updated successfully",
                    "id", id.toString(),
                    "newStatus", newStatus.toString()
            ));

        } catch (Exception e) {
            log.error("Error toggling user status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Status update failed: " + e.getMessage()));
        }
    }

}