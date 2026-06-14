package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.WorkDetailsService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WorkDetailsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("WorkDetailsController security and endpoints")
class WorkDetailsControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    WorkDetailsService workDetailsService;

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
    // GET /api/work-details
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/work-details without authentication is denied with 403")
    void getAllWorkDetails_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/work-details")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-details as an authenticated Gardener returns 200 with the list")
    void getAllWorkDetails_withGardenerAuthority_returns200() throws Exception {
        // Arrange
        when(workDetailsService.getAllWorkDetails()).thenReturn(List.of(sampleDto(10L)));

        // Act & Assert
        mvc.perform(get("/api/work-details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].isPaidHourly").value(true))
                .andExpect(jsonPath("$[0].hourlyPay").value(25.50))
                .andExpect(jsonPath("$[0].payPerKilogram").value(1.20))
                .andExpect(jsonPath("$[0].userDTO.nickname").value("jan-ogrodnik"));
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/work-details as any other authenticated authority also returns 200 (no role restriction)")
    void getAllWorkDetails_withEmployeeAuthority_returns200() throws Exception {
        // The route falls under anyRequest().authenticated(), so any authenticated authority is allowed.
        when(workDetailsService.getAllWorkDetails()).thenReturn(List.of());

        mvc.perform(get("/api/work-details")).andExpect(status().isOk());
    }

    // ---------------------------------------------------------------------
    // GET /api/work-details/user/{userId}
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/work-details/user/{userId} without authentication is denied with 403")
    void getWorkDetailsByUser_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/work-details/user/5")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-details/user/{userId} returns 200 with the user's work details")
    void getWorkDetailsByUser_withAuthentication_returns200() throws Exception {
        // Arrange
        when(workDetailsService.getWorkDetailsByUserId(5L)).thenReturn(List.of(sampleDto(1L)));

        // Act & Assert
        mvc.perform(get("/api/work-details/user/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(1));

        verify(workDetailsService).getWorkDetailsByUserId(5L);
    }

    // ---------------------------------------------------------------------
    // GET /api/work-details/user/{userId}/latest
    // ---------------------------------------------------------------------

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-details/user/{userId}/latest returns 200 when details are present")
    void getLatestWorkDetailsForUser_whenPresent_returns200() throws Exception {
        // Arrange
        when(workDetailsService.getLatestWorkDetailsForUser(5L)).thenReturn(Optional.of(sampleDto(7L)));

        // Act & Assert
        mvc.perform(get("/api/work-details/user/5/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.hourlyPay").value(25.50))
                .andExpect(jsonPath("$.userDTO.id").value(1));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-details/user/{userId}/latest returns 204 when no details exist")
    void getLatestWorkDetailsForUser_whenEmpty_returns204() throws Exception {
        // Arrange
        when(workDetailsService.getLatestWorkDetailsForUser(5L)).thenReturn(Optional.empty());

        // Act & Assert
        mvc.perform(get("/api/work-details/user/5/latest")).andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/work-details/user/{userId}/latest without authentication is denied with 403")
    void getLatestWorkDetailsForUser_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/work-details/user/5/latest")).andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------------
    // POST /api/work-details
    // ---------------------------------------------------------------------

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/work-details returns 201 with the created details on success")
    void createWorkDetails_whenValid_returns201() throws Exception {
        // Arrange
        WorkDetailsDto request = sampleDto(null);
        when(workDetailsService.createWorkDetails(any(WorkDetailsDto.class))).thenReturn(sampleDto(42L));

        // Act & Assert
        mvc.perform(post("/api/work-details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.isPaidHourly").value(true))
                .andExpect(jsonPath("$.payPerKilogram").value(1.20));

        verify(workDetailsService).createWorkDetails(any(WorkDetailsDto.class));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/work-details returns 400 when the service rejects the input with IllegalArgumentException")
    void createWorkDetails_whenServiceThrowsIllegalArgument_returns400() throws Exception {
        // Arrange
        WorkDetailsDto request = sampleDto(null);
        when(workDetailsService.createWorkDetails(any(WorkDetailsDto.class)))
                .thenThrow(new IllegalArgumentException("Nieprawidłowe dane"));

        // Act & Assert
        mvc.perform(post("/api/work-details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/work-details without authentication is denied with 403 and never touches the service")
    void createWorkDetails_withoutAuthentication_isDenied() throws Exception {
        // Act & Assert
        mvc.perform(post("/api/work-details")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(null))))
                .andExpect(status().isForbidden());

        verify(workDetailsService, never()).createWorkDetails(any());
    }

    // ---------------------------------------------------------------------
    // PUT /api/work-details/{id}
    // ---------------------------------------------------------------------

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/work-details/{id} returns 200 with the updated details on success")
    void updateWorkDetails_whenValid_returns200() throws Exception {
        // Arrange
        WorkDetailsDto request = sampleDto(3L);
        when(workDetailsService.updateWorkDetails(eq(3L), any(WorkDetailsDto.class))).thenReturn(sampleDto(3L));

        // Act & Assert
        mvc.perform(put("/api/work-details/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.hourlyPay").value(25.50));

        verify(workDetailsService).updateWorkDetails(eq(3L), any(WorkDetailsDto.class));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/work-details/{id} returns 400 when the service throws IllegalArgumentException")
    void updateWorkDetails_whenServiceThrowsIllegalArgument_returns400() throws Exception {
        // Arrange
        when(workDetailsService.updateWorkDetails(eq(3L), any(WorkDetailsDto.class)))
                .thenThrow(new IllegalArgumentException("Nieprawidłowe dane"));

        // Act & Assert
        mvc.perform(put("/api/work-details/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(3L))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/work-details/{id} returns 404 when the service throws RuntimeException (not found)")
    void updateWorkDetails_whenServiceThrowsRuntime_returns404() throws Exception {
        // Arrange
        when(workDetailsService.updateWorkDetails(eq(99L), any(WorkDetailsDto.class)))
                .thenThrow(new RuntimeException("Nie znaleziono detali pracy o ID: 99"));

        // Act & Assert
        mvc.perform(put("/api/work-details/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(99L))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/work-details/{id} without authentication is denied with 403")
    void updateWorkDetails_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/work-details/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleDto(3L))))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------------
    // DELETE /api/work-details/{id}
    // ---------------------------------------------------------------------

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/work-details/{id} returns 204 on successful deletion")
    void deleteWorkDetails_whenExists_returns204() throws Exception {
        // Arrange
        doNothing().when(workDetailsService).deleteWorkDetails(3L);

        // Act & Assert
        mvc.perform(delete("/api/work-details/3")).andExpect(status().isNoContent());
        verify(workDetailsService).deleteWorkDetails(3L);
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/work-details/{id} returns 404 when the service throws RuntimeException (not found)")
    void deleteWorkDetails_whenServiceThrowsRuntime_returns404() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Nie znaleziono detali pracy o ID: 99"))
                .when(workDetailsService).deleteWorkDetails(99L);

        // Act & Assert
        mvc.perform(delete("/api/work-details/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/work-details/{id} without authentication is denied with 403 and never touches the service")
    void deleteWorkDetails_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(delete("/api/work-details/3")).andExpect(status().isForbidden());
        verify(workDetailsService, never()).deleteWorkDetails(any());
    }

    // ---------------------------------------------------------------------
    // Token-driven authentication (mirrors ExpenseControllerTest)
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("a blocked user with a valid token is denied with 403")
    void getAllWorkDetails_withValidTokenButBlockedUser_isDenied() throws Exception {
        // Arrange
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findActiveByNickname("blocked")).thenReturn(Optional.of(false));

        // Act & Assert
        mvc.perform(get("/api/work-details").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches the endpoint with 200")
    void getAllWorkDetails_withValidTokenAndActiveUser_returns200() throws Exception {
        // Arrange
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findActiveByNickname("active")).thenReturn(Optional.of(true));
        when(workDetailsService.getAllWorkDetails()).thenReturn(List.of());

        // Act & Assert
        mvc.perform(get("/api/work-details").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private WorkDetailsDto sampleDto(Long id) {
        UserDto user = new UserDto();
        user.setId(1L);
        user.setNickname("jan-ogrodnik");

        WorkDetailsDto dto = new WorkDetailsDto();
        dto.setId(id);
        dto.setIsPaidHourly(Boolean.TRUE);
        dto.setHourlyPay(new BigDecimal("25.50"));
        dto.setPayPerKilogram(new BigDecimal("1.20"));
        dto.setCreatedAt(LocalDateTime.of(2026, 6, 13, 10, 0));
        dto.setUserDTO(user);
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
