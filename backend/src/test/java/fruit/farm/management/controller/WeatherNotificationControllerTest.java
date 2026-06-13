package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.WeatherNotificationDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WeatherNotificationType;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.WeatherNotificationService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WeatherNotificationController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("WeatherNotificationController security and behaviour")
class WeatherNotificationControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    WeatherNotificationService notificationService;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    PasswordEncoder passwordEncoder;
    @MockitoBean
    fruit.farm.management.repository.UserRepository userRepository;

    // --- GET /api/weather-notifications ---

    @Test
    @DisplayName("GET /api/weather-notifications without authentication is denied (403)")
    void getAllNotifications_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/weather-notifications")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/weather-notifications as an authenticated Gardener returns 200 with the notifications")
    void getAllNotifications_asAuthenticatedGardener_returns200() throws Exception {
        when(notificationService.getAllNotificationsForUser(any()))
                .thenReturn(List.of(sampleDto(1L)));

        mvc.perform(get("/api/weather-notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].weatherNotificationType").value("FROST_WARNING"))
                .andExpect(jsonPath("$[0].daysAhead").value(3))
                .andExpect(jsonPath("$[0].enabled").value(true));
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/weather-notifications as any authenticated user (Employee) is allowed (200)")
    void getAllNotifications_asAuthenticatedEmployee_returns200() throws Exception {
        // No specific role is required for /api/weather-notifications; anyRequest().authenticated() applies.
        when(notificationService.getAllNotificationsForUser(any())).thenReturn(List.of());

        mvc.perform(get("/api/weather-notifications")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/weather-notifications returns 500 when the service throws")
    void getAllNotifications_whenServiceThrows_returns500() throws Exception {
        when(notificationService.getAllNotificationsForUser(any()))
                .thenThrow(new RuntimeException("User not found"));

        mvc.perform(get("/api/weather-notifications")).andExpect(status().isInternalServerError());
    }

    // --- GET /api/weather-notifications/{id} ---

    @Test
    @DisplayName("GET /api/weather-notifications/{id} without authentication is denied (403)")
    void getNotificationById_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/weather-notifications/5")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/weather-notifications/{id} returns 200 when the notification exists")
    void getNotificationById_whenFound_returns200() throws Exception {
        when(notificationService.getNotificationById(eq(5L), any()))
                .thenReturn(Optional.of(sampleDto(5L)));

        mvc.perform(get("/api/weather-notifications/5")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/weather-notifications/{id} returns 400 when the notification is missing")
    void getNotificationById_whenMissing_returns400() throws Exception {
        when(notificationService.getNotificationById(eq(99L), any()))
                .thenReturn(Optional.empty());

        mvc.perform(get("/api/weather-notifications/99"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Failed to get notification"));
    }

    // --- POST /api/weather-notifications ---

    @Test
    @DisplayName("POST /api/weather-notifications without authentication is denied (403)")
    void createNotification_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(post("/api/weather-notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(null))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/weather-notifications with a valid body returns 201 and the created notification")
    void createNotification_withValidBody_returns201() throws Exception {
        when(notificationService.createNotification(any(), any())).thenReturn(sampleDto(10L));

        mvc.perform(post("/api/weather-notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.weatherNotificationType").value("FROST_WARNING"))
                .andExpect(jsonPath("$.daysAhead").value(3));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/weather-notifications returns 400 when the service rejects the input with a RuntimeException")
    void createNotification_whenServiceRejectsInput_returns400() throws Exception {
        // The controller has no @Valid; domain validation lives in the service and maps a RuntimeException to 400.
        when(notificationService.createNotification(any(), any()))
                .thenThrow(new RuntimeException("Days ahead must be between 1 and 7"));

        mvc.perform(post("/api/weather-notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Days ahead must be between 1 and 7"));
    }

    // --- PUT /api/weather-notifications/{id} ---

    @Test
    @DisplayName("PUT /api/weather-notifications/{id} without authentication is denied (403)")
    void updateNotification_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/weather-notifications/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(3L))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/weather-notifications/{id} with a valid body returns 200 and the updated notification")
    void updateNotification_withValidBody_returns200() throws Exception {
        when(notificationService.updateNotification(eq(3L), any(), any())).thenReturn(sampleDto(3L));

        mvc.perform(put("/api/weather-notifications/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(3L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/weather-notifications/{id} returns 400 when the service rejects the update with a RuntimeException")
    void updateNotification_whenServiceRejectsInput_returns400() throws Exception {
        when(notificationService.updateNotification(eq(3L), any(), any()))
                .thenThrow(new RuntimeException("Unauthorized access to notification"));

        mvc.perform(put("/api/weather-notifications/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(3L))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unauthorized access to notification"));
    }

    // --- PATCH /api/weather-notifications/{id}/toggle ---

    @Test
    @DisplayName("PATCH /api/weather-notifications/{id}/toggle without authentication is denied (403)")
    void toggleNotificationStatus_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/weather-notifications/7/toggle")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/weather-notifications/{id}/toggle returns 200 with the new enabled flag")
    void toggleNotificationStatus_whenAuthenticated_returns200() throws Exception {
        WeatherNotificationDto toggled = sampleDto(7L);
        toggled.setEnabled(false);
        when(notificationService.toggleNotificationStatus(eq(7L), any())).thenReturn(toggled);

        mvc.perform(patch("/api/weather-notifications/7/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/weather-notifications/{id}/toggle returns 500 when the service throws")
    void toggleNotificationStatus_whenServiceThrows_returns500() throws Exception {
        when(notificationService.toggleNotificationStatus(eq(7L), any()))
                .thenThrow(new RuntimeException("Notification not found with ID: 7"));

        mvc.perform(patch("/api/weather-notifications/7/toggle"))
                .andExpect(status().isInternalServerError());
    }

    // --- DELETE /api/weather-notifications/{id} ---

    @Test
    @DisplayName("DELETE /api/weather-notifications/{id} without authentication is denied (403)")
    void deleteNotification_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(delete("/api/weather-notifications/4")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/weather-notifications/{id} returns 200 with a confirmation payload")
    void deleteNotification_whenAuthenticated_returns200() throws Exception {
        mvc.perform(delete("/api/weather-notifications/4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.message").value("Notification deleted successfully"));

        verify(notificationService).deleteNotification(eq(4L), any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/weather-notifications/{id} returns 500 when the service throws")
    void deleteNotification_whenServiceThrows_returns500() throws Exception {
        doThrow(new RuntimeException("Notification not found with ID: 4"))
                .when(notificationService).deleteNotification(eq(4L), any());

        mvc.perform(delete("/api/weather-notifications/4"))
                .andExpect(status().isInternalServerError());
    }

    // --- GET /api/weather-notifications/stats ---

    @Test
    @DisplayName("GET /api/weather-notifications/stats without authentication is denied (403)")
    void getNotificationStats_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/weather-notifications/stats")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/weather-notifications/stats returns 200 with the aggregated statistics")
    void getNotificationStats_whenAuthenticated_returns200() throws Exception {
        when(notificationService.getNotificationStats(any()))
                .thenReturn(new WeatherNotificationService.NotificationStats(3L, 2L, 2L));

        mvc.perform(get("/api/weather-notifications/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalNotifications").value(3))
                .andExpect(jsonPath("$.activeNotifications").value(2))
                .andExpect(jsonPath("$.uniqueTypes").value(2));
    }

    @Test
    @DisplayName("a blocked user with a valid token is denied (403)")
    void getAllNotifications_withValidTokenButBlockedUser_isDenied() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("blocked")).thenReturn(Optional.of(userWithActive(false)));

        mvc.perform(get("/api/weather-notifications").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches the endpoint (200)")
    void getAllNotifications_withValidTokenAndActiveUser_returns200() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(userWithActive(true)));
        when(notificationService.getAllNotificationsForUser(any())).thenReturn(List.of());

        mvc.perform(get("/api/weather-notifications").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    private WeatherNotificationDto sampleDto(Long id) {
        WeatherNotificationDto dto = new WeatherNotificationDto();
        dto.setId(id);
        dto.setWeatherNotificationType(WeatherNotificationType.FROST_WARNING);
        dto.setThreshold(0.0);
        dto.setDaysAhead(3);
        dto.setEnabled(true);
        dto.setDescription("Ostrzeżenie o przymrozku");
        return dto;
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
