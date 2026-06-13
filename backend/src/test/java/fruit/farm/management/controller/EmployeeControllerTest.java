package fruit.farm.management.controller;

import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeController.deleteUser")
class EmployeeControllerTest {

    @Mock
    UserService userService;

    @InjectMocks
    EmployeeController controller;

    @Test
    @DisplayName("deletes the user and returns 200 when the user exists")
    void deleteUser_whenUserExists_deletesAndReturnsOk() {
        UserEntity user = new UserEntity();
        user.setNickname("johnny");
        when(userService.findUserEntityById(5L)).thenReturn(Optional.of(user));

        ResponseEntity<Map<String, String>> response = controller.deleteUser(5L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .containsEntry("message", "User deleted successfully")
                .containsEntry("nickname", "johnny");
        verify(userService).delete(user);
    }

    @Test
    @DisplayName("returns 404 and does not delete when the user is missing")
    void deleteUser_whenUserMissing_returnsNotFoundAndDoesNotDelete() {
        when(userService.findUserEntityById(99L)).thenReturn(Optional.empty());

        ResponseEntity<Map<String, String>> response = controller.deleteUser(99L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(userService, never()).delete(org.mockito.ArgumentMatchers.any());
    }
}
