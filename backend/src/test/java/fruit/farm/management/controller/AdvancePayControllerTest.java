package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.AdvancePayDto;
import fruit.farm.management.dto.AdvancePaySumDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.UserService;
import fruit.farm.management.service.WorkScheduleService;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdvancePayController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("AdvancePayController security and behavior")
class AdvancePayControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    UserService userService;
    @MockitoBean
    WorkScheduleService workScheduleService;

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
    // POST /api/advances
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/advances without authentication is denied (403)")
    void createAdvance_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        AdvancePayDto request = new AdvancePayDto(null, 5L, new BigDecimal("100.00"), "Zaliczka", null, false);

        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/advances with a valid body as an authenticated user returns 201 and records the advance")
    void createAdvance_withValidBody_returns201() throws Exception {
        // Arrange
        UserEntity employee = userWithActive(true);
        employee.setId(5L);
        when(userService.findUserEntityById(5L)).thenReturn(Optional.of(employee));

        AdvancePayDto request = new AdvancePayDto(null, 5L, new BigDecimal("150.50"), "Zaliczka czerwcowa", null, false);

        // Act + Assert
        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Advance payment recorded successfully"))
                .andExpect(jsonPath("$.amount").value("150.50"));

        verify(workScheduleService)
                .saveAdvance(eq(employee), eq(new BigDecimal("150.50")), eq("Zaliczka czerwcowa"), any(LocalDate.class));
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("POST /api/advances is reachable by any authenticated authority (not only Gardener)")
    void createAdvance_withEmployeeAuthority_returns201() throws Exception {
        // /api/advances/** is not explicitly mapped in SecurityConfig, so any authenticated user may access it.
        UserEntity employee = userWithActive(true);
        employee.setId(7L);
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(employee));

        AdvancePayDto request = new AdvancePayDto(null, 7L, new BigDecimal("10.00"), null, null, false);

        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(workScheduleService)
                .saveAdvance(eq(employee), eq(new BigDecimal("10.00")), isNull(), any(LocalDate.class));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/advances with a null userId returns 400 and never touches the service")
    void createAdvance_withNullUserId_returns400() throws Exception {
        AdvancePayDto request = new AdvancePayDto(null, null, new BigDecimal("100.00"), "Zaliczka", null, false);

        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing or invalid getUserId() or amount"));

        verify(workScheduleService, never()).saveAdvance(any(), any(), any(), any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/advances with a null amount returns 400 and never touches the service")
    void createAdvance_withNullAmount_returns400() throws Exception {
        AdvancePayDto request = new AdvancePayDto(null, 5L, null, "Zaliczka", null, false);

        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing or invalid getUserId() or amount"));

        verify(workScheduleService, never()).saveAdvance(any(), any(), any(), any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/advances with a non-positive amount returns 400 and never touches the service")
    void createAdvance_withZeroAmount_returns400() throws Exception {
        // Boundary: amount of exactly zero is rejected (compareTo(ZERO) <= 0).
        AdvancePayDto request = new AdvancePayDto(null, 5L, BigDecimal.ZERO, "Zaliczka", null, false);

        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing or invalid getUserId() or amount"));

        verify(workScheduleService, never()).saveAdvance(any(), any(), any(), any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/advances for an unknown employee returns 404 with the error message")
    void createAdvance_withUnknownEmployee_returns404() throws Exception {
        // Arrange: the employee does not exist, so the controller maps the RuntimeException to 404.
        when(userService.findUserEntityById(99L)).thenReturn(Optional.empty());

        AdvancePayDto request = new AdvancePayDto(null, 99L, new BigDecimal("100.00"), "Zaliczka", null, false);

        mvc.perform(post("/api/advances")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Employee not found with ID: 99"));

        verify(workScheduleService, never()).saveAdvance(any(), any(), any(), any());
    }

    // ---------------------------------------------------------------------
    // GET /api/advances/user/{userId}/unsettled
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/advances/user/{id}/unsettled without authentication is denied (403)")
    void getUnsettledAdvances_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/advances/user/5/unsettled")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/advances/user/{id}/unsettled as an authenticated user returns 200 with the list")
    void getUnsettledAdvances_withAuthentication_returns200() throws Exception {
        // Arrange
        AdvancePayDto advance = new AdvancePayDto(1L, 5L, new BigDecimal("75.00"), "Zaliczka", LocalDate.of(2026, 6, 1), false);
        when(workScheduleService.getUnsettledAdvancesByUserId(5L)).thenReturn(List.of(advance));

        // Act + Assert
        mvc.perform(get("/api/advances/user/5/unsettled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].userId").value(5))
                .andExpect(jsonPath("$[0].amount").value(75.00));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/advances/user/{id}/unsettled returns 200 with an empty list when there are no advances")
    void getUnsettledAdvances_withNoAdvances_returnsEmptyList() throws Exception {
        when(workScheduleService.getUnsettledAdvancesByUserId(5L)).thenReturn(List.of());

        mvc.perform(get("/api/advances/user/5/unsettled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/advances/user/{id}/unsettled returns 404 when the service throws a RuntimeException")
    void getUnsettledAdvances_whenServiceThrows_returns404() throws Exception {
        when(workScheduleService.getUnsettledAdvancesByUserId(5L))
                .thenThrow(new RuntimeException("Employee not found"));

        mvc.perform(get("/api/advances/user/5/unsettled"))
                .andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------------
    // GET /api/advances/user/sum-unsettled
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/advances/user/sum-unsettled without authentication is denied (403)")
    void getSumUnsettledAdvances_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/advances/user/sum-unsettled")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/advances/user/sum-unsettled returns 200 with the sum for the logged user")
    void getSumUnsettledAdvances_withAuthentication_returns200() throws Exception {
        // Arrange
        UserDto logged = new UserDto();
        logged.setId(5L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(workScheduleService.getSumUnsettledAdvancesByUserId(5L))
                .thenReturn(new AdvancePaySumDto(new BigDecimal("225.50")));

        // Act + Assert
        mvc.perform(get("/api/advances/user/sum-unsettled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(225.50));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/advances/user/sum-unsettled returns 404 when the service throws a RuntimeException")
    void getSumUnsettledAdvances_whenServiceThrows_returns404() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(5L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(workScheduleService.getSumUnsettledAdvancesByUserId(5L))
                .thenThrow(new RuntimeException("boom"));

        mvc.perform(get("/api/advances/user/sum-unsettled"))
                .andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------------
    // PUT /api/advances/user/{userId}
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PUT /api/advances/user/{id} without authentication is denied (403)")
    void payOffAllUnsettledAdvances_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/advances/user/5")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/advances/user/{id} pays off advances and returns 200 with the recomputed sum")
    void payOffAllUnsettledAdvances_withAuthentication_returns200() throws Exception {
        // Arrange: after pay-off the unsettled sum is zero.
        when(workScheduleService.getSumUnsettledAdvancesByUserId(5L))
                .thenReturn(new AdvancePaySumDto(BigDecimal.ZERO));

        // Act + Assert
        mvc.perform(put("/api/advances/user/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(0));

        verify(workScheduleService).payOffAllUnsettledAdvancePays(5L);
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/advances/user/{id} returns 404 when paying off throws a RuntimeException")
    void payOffAllUnsettledAdvances_whenServiceThrows_returns404() throws Exception {
        org.mockito.Mockito.doThrow(new RuntimeException("Employee not found"))
                .when(workScheduleService).payOffAllUnsettledAdvancePays(5L);

        mvc.perform(put("/api/advances/user/5"))
                .andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------------
    // Token-based authentication via the JWT filter (mirrors the sibling suite)
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("a blocked user with a valid token is denied (403)")
    void getUnsettledAdvances_withValidTokenButBlockedUser_isDenied() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("blocked")).thenReturn(Optional.of(userWithActive(false)));

        mvc.perform(get("/api/advances/user/5/unsettled").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches the endpoint (200)")
    void getUnsettledAdvances_withValidTokenAndActiveUser_returns200() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(userWithActive(true)));

        when(workScheduleService.getUnsettledAdvancesByUserId(5L)).thenReturn(List.of());

        mvc.perform(get("/api/advances/user/5/unsettled").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
