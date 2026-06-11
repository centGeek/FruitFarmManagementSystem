package fruit.farm.management.controller;

import fruit.farm.management.dto.AdminUserDto;
import fruit.farm.management.service.AdminUserService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
@Slf4j
public class AdminController {

    private AdminUserService adminUserService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {

        log.info("Admin is fetching all users");
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<String>> getAllRoles() {

        return ResponseEntity.ok(adminUserService.getAllRoles());
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserDto> setActive(@PathVariable Long id,
                                                  @RequestBody StatusRequest request) {

        log.info("Admin is setting active={} for user {}", request.getActive(), id);
        return ResponseEntity.ok(adminUserService.setActive(id, request.getActive()));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserDto> changeRole(@PathVariable Long id,
                                                   @RequestBody RoleRequest request) {

        log.info("Admin is changing role of user {} to {}", id, request.getRoleName());
        return ResponseEntity.ok(adminUserService.changeRole(id, request.getRoleName()));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long id,
                                                             @RequestBody PasswordRequest request) {

        adminUserService.resetPassword(id, request.getPassword());
        return ResponseEntity.ok(Map.of("message", "Hasło zostało zresetowane"));
    }

    @Data
    public static class StatusRequest {
        @NotNull(message = "Status jest wymagany")
        private Boolean active;
    }

    @Data
    public static class RoleRequest {
        @NotBlank(message = "Rola jest wymagana")
        private String roleName;
    }

    @Data
    public static class PasswordRequest {
        @Size(min = 6, message = "Hasło musi mieć co najmniej 6 znaków")
        private String password;
    }
}
