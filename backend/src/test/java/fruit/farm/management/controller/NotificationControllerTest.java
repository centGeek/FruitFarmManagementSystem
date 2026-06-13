package fruit.farm.management.controller;

import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.NotificationType;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.NotificationService;
import fruit.farm.management.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("NotificationController security and behavior")
class NotificationControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    NotificationService notificationService;
    @MockitoBean
    UserService userService;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    PasswordEncoder passwordEncoder;
    @MockitoBean
    fruit.farm.management.repository.UserRepository userRepository;

    // ---------------------------------------------------------------------
    // GET /api/notification — falls under anyRequest().authenticated()
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/notification without authentication is denied (403)")
    void getAllNotifications_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/notification")).andExpect(status().isForbidden());

        verify(userService, never()).getLoggedUser();
        verify(notificationService, never()).getAllNotificationsByUserSortedByDate(anyLong());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/notification as a Gardener returns 200 with the logged user's notifications")
    void getAllNotifications_withGardenerAuthority_returns200() throws Exception {
        // Arrange
        UserDto logged = new UserDto();
        logged.setId(7L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(notificationService.getAllNotificationsByUserSortedByDate(7L))
                .thenReturn(List.of(notification(1L, "Tytuł", "Treść")));

        // Act + Assert
        mvc.perform(get("/api/notification"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Tytuł"))
                .andExpect(jsonPath("$[0].message").value("Treść"));

        // The endpoint resolves the logged user and queries by that id.
        verify(userService).getLoggedUser();
        verify(notificationService).getAllNotificationsByUserSortedByDate(7L);
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/notification as an Employee returns 200 (route only requires authentication)")
    void getAllNotifications_withEmployeeAuthority_returns200() throws Exception {
        // Arrange — the route is not role-restricted, so any authenticated authority is allowed.
        UserDto logged = new UserDto();
        logged.setId(3L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(notificationService.getAllNotificationsByUserSortedByDate(3L)).thenReturn(List.of());

        // Act + Assert
        mvc.perform(get("/api/notification"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(notificationService).getAllNotificationsByUserSortedByDate(3L);
    }

    @Test
    @DisplayName("an active user authenticated via token reaches GET /api/notification (200)")
    void getAllNotifications_withValidTokenAndActiveUser_returns200() throws Exception {
        // Arrange — drive the real JwtAuthenticationFilter end to end.
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(userWithActive(true)));

        UserDto logged = new UserDto();
        logged.setId(5L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(notificationService.getAllNotificationsByUserSortedByDate(5L)).thenReturn(List.of());

        // Act + Assert
        mvc.perform(get("/api/notification").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("a blocked user with a valid token is denied GET /api/notification (403)")
    void getAllNotifications_withValidTokenButBlockedUser_isDenied() throws Exception {
        // Arrange — the filter clears the context for an inactive user.
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("blocked")).thenReturn(Optional.of(userWithActive(false)));

        // Act + Assert
        mvc.perform(get("/api/notification").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());

        verify(userService, never()).getLoggedUser();
    }

    // ---------------------------------------------------------------------
    // GET /api/notification/user/{userId} — same authenticated-only rule
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/notification/user/{userId} without authentication is denied (403)")
    void getNotificationsByUser_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/notification/user/{userId}", 42L)).andExpect(status().isForbidden());

        verify(notificationService, never()).getNotificationsByUserSortedByDate(anyLong());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/notification/user/{userId} as a Gardener returns 200 and passes the path id through")
    void getNotificationsByUser_withGardenerAuthority_returns200() throws Exception {
        // Arrange
        when(notificationService.getNotificationsByUserSortedByDate(42L))
                .thenReturn(List.of(notification(9L, "Powiadomienie", "Wiadomość")));

        // Act + Assert
        mvc.perform(get("/api/notification/user/{userId}", 42L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[0].title").value("Powiadomienie"))
                .andExpect(jsonPath("$[0].message").value("Wiadomość"));

        // The path variable is forwarded unchanged; the logged user is irrelevant here.
        verify(notificationService).getNotificationsByUserSortedByDate(42L);
        verify(userService, never()).getLoggedUser();
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/notification/user/{userId} as an Employee returns 200 with an empty list")
    void getNotificationsByUser_withEmployeeAuthority_returns200() throws Exception {
        // Arrange
        when(notificationService.getNotificationsByUserSortedByDate(100L)).thenReturn(List.of());

        // Act + Assert
        mvc.perform(get("/api/notification/user/{userId}", 100L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(notificationService).getNotificationsByUserSortedByDate(100L);
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/notification/user/{userId} with a non-numeric id is rejected before the service is hit (500)")
    void getNotificationsByUser_withNonNumericPathVariable_returns500() throws Exception {
        // Arrange — "abc" cannot be bound to a Long path variable, so Spring raises a
        // MethodArgumentTypeMismatchException. That is a RuntimeException, and the application's
        // GlobalExceptionHandler (picked up by @WebMvcTest as a @ControllerAdvice) maps every
        // unhandled RuntimeException to 500, taking precedence over the framework's default 400.

        // Act + Assert
        mvc.perform(get("/api/notification/user/{userId}", "abc"))
                .andExpect(status().isInternalServerError());

        verify(notificationService, never()).getNotificationsByUserSortedByDate(anyLong());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches GET /api/notification/user/{userId} (200)")
    void getNotificationsByUser_withValidTokenAndActiveUser_returns200() throws Exception {
        // Arrange
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Employee"));
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(userWithActive(true)));
        when(notificationService.getNotificationsByUserSortedByDate(eq(11L))).thenReturn(List.of());

        // Act + Assert
        mvc.perform(get("/api/notification/user/{userId}", 11L).cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());

        verify(notificationService).getNotificationsByUserSortedByDate(11L);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private NotificationDto notification(Long id, String title, String message) {
        return NotificationDto.builder()
                .id(id)
                .notificationType(NotificationType.USER)
                .title(title)
                .message(message)
                .createdAt(LocalDateTime.of(2026, 6, 13, 10, 0))
                .build();
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
