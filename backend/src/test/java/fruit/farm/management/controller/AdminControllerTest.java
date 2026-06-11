package fruit.farm.management.controller;

import fruit.farm.management.dto.AdminStatsDto;
import fruit.farm.management.dto.AdminUserDto;
import fruit.farm.management.dto.AuditLogDto;
import fruit.farm.management.service.AdminStatsService;
import fruit.farm.management.service.AdminUserService;
import fruit.farm.management.service.AuditLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController")
class AdminControllerTest {

    @Mock
    AdminUserService adminUserService;

    @Mock
    AdminStatsService adminStatsService;

    @Mock
    AuditLogService auditLogService;

    @InjectMocks
    AdminController controller;

    @Test
    @DisplayName("getAuditLog returns the service result with 200")
    void getAuditLog_returnsServiceResult() {
        List<AuditLogDto> entries = List.of(AuditLogDto.builder().id(1L).action("USER_BLOCKED").build());
        when(auditLogService.getRecentLogs()).thenReturn(entries);

        ResponseEntity<List<AuditLogDto>> response = controller.getAuditLog();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(entries);
    }

    @Test
    @DisplayName("getStats returns the service result with 200")
    void getStats_returnsServiceResult() {
        AdminStatsDto stats = AdminStatsDto.builder().totalUsers(7).build();
        when(adminStatsService.getStats()).thenReturn(stats);

        ResponseEntity<AdminStatsDto> response = controller.getStats();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(stats);
    }

    @Test
    @DisplayName("getAllUsers returns the service result with 200")
    void getAllUsers_returnsServiceResult() {
        List<AdminUserDto> users = List.of(AdminUserDto.builder().id(1L).build());
        when(adminUserService.getAllUsers()).thenReturn(users);

        ResponseEntity<List<AdminUserDto>> response = controller.getAllUsers();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(users);
    }

    @Test
    @DisplayName("setActive delegates to the service with the request flag")
    void setActive_delegatesToService() {
        AdminUserDto dto = AdminUserDto.builder().id(5L).isActive(false).build();
        when(adminUserService.setActive(5L, false)).thenReturn(dto);
        AdminController.StatusRequest request = new AdminController.StatusRequest();
        request.setActive(false);

        ResponseEntity<AdminUserDto> response = controller.setActive(5L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(dto);
        verify(adminUserService).setActive(5L, false);
    }

    @Test
    @DisplayName("changeRole delegates to the service with the requested role")
    void changeRole_delegatesToService() {
        AdminUserDto dto = AdminUserDto.builder().id(5L).roleName("Gardener").build();
        when(adminUserService.changeRole(5L, "Gardener")).thenReturn(dto);
        AdminController.RoleRequest request = new AdminController.RoleRequest();
        request.setRoleName("Gardener");

        ResponseEntity<AdminUserDto> response = controller.changeRole(5L, request);

        assertThat(response.getBody()).isEqualTo(dto);
        verify(adminUserService).changeRole(5L, "Gardener");
    }

    @Test
    @DisplayName("resetPassword delegates to the service and returns a confirmation message")
    void resetPassword_delegatesAndReturnsMessage() {
        AdminController.PasswordRequest request = new AdminController.PasswordRequest();
        request.setPassword("newpass123");

        ResponseEntity<Map<String, String>> response = controller.resetPassword(5L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("message");
        verify(adminUserService).resetPassword(5L, "newpass123");
    }
}
