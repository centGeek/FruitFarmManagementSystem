package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.ProfitDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProfitType;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.ProfitService;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfitController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("ProfitController security and endpoints")
class ProfitControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    ProfitService profitService;
    @MockitoBean
    UserService userService;
    @MockitoBean
    SectorService sectorService;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    PasswordEncoder passwordEncoder;
    @MockitoBean
    fruit.farm.management.repository.UserRepository userRepository;

    // --- GET /api/profits authorization ---

    @Test
    @DisplayName("GET /api/profits without authentication is denied (403)")
    void getAllProfits_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/profits")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/profits as a Gardener returns 200")
    void getAllProfits_withGardenerAuthority_returns200() throws Exception {
        // Arrange
        UserDto logged = loggedUser();
        when(userService.getLoggedUser()).thenReturn(logged);
        when(profitService.getAllPaginatedProfitsByGardener(any(), any(), any(), any()))
                .thenReturn(Page.empty());

        // Act + Assert
        mvc.perform(get("/api/profits")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/profits as any authenticated user (Employee) returns 200 since the route only requires authentication")
    void getAllProfits_withEmployeeAuthority_returns200() throws Exception {
        // Arrange — /api/profits/** is not role-restricted in SecurityConfig, only authenticated().
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        when(profitService.getAllPaginatedProfitsByGardener(any(), any(), any(), any()))
                .thenReturn(Page.empty());

        // Act + Assert
        mvc.perform(get("/api/profits")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/profits maps the service page into ProfitResponse payloads")
    void getAllProfits_withResults_mapsResponseBody() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        ProfitDto profit = validProfitDto();
        profit.setPurchaseId(99L);
        when(profitService.getAllPaginatedProfitsByGardener(any(), any(), any(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(profit)));

        // Act + Assert
        mvc.perform(get("/api/profits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].purchaseId").value(99))
                .andExpect(jsonPath("$.content[0].profitType").value("SPRZEDAZ_JABLEK"))
                .andExpect(jsonPath("$.content[0].kilogramsSold").value(120));
    }

    // --- Token-driven authentication via the real filter ---

    @Test
    @DisplayName("a blocked user with a valid token is denied (403)")
    void getAllProfits_withValidTokenButBlockedUser_isDenied() throws Exception {
        // Arrange
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("blocked")).thenReturn(Optional.of(userWithActive(false)));

        // Act + Assert
        mvc.perform(get("/api/profits").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches the endpoint (200)")
    void getAllProfits_withValidTokenAndActiveUser_returns200() throws Exception {
        // Arrange
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(userWithActive(true)));

        when(userService.getLoggedUser()).thenReturn(loggedUser());
        when(profitService.getAllPaginatedProfitsByGardener(any(), any(), any(), any()))
                .thenReturn(Page.empty());

        // Act + Assert
        mvc.perform(get("/api/profits").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    // --- POST /api/profits ---

    @Test
    @DisplayName("POST /api/profits without authentication is denied (403)")
    void createProfit_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(post("/api/profits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/profits with a valid body returns 201 and the created profit")
    void createProfit_withValidBody_returns201() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        ProfitDto created = validProfitDto();
        created.setPurchaseId(7L);
        when(profitService.addProfit(any(ProfitDto.class), any(UserDto.class))).thenReturn(created);

        // Act + Assert
        mvc.perform(post("/api/profits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.purchaseId").value(7));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/profits with an invalid body (missing required fields) returns 400")
    void createProfit_withInvalidBody_returns400() throws Exception {
        // Arrange — empty body fails @NotNull validation on createdAt, profitType, kilogramsSold, profit, description.
        when(userService.getLoggedUser()).thenReturn(loggedUser());

        // Act + Assert
        mvc.perform(post("/api/profits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/profits with a non-positive profit amount returns 400")
    void createProfit_withNonPositiveProfit_returns400() throws Exception {
        // Arrange — profit below the @DecimalMin(0.01) threshold must be rejected.
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        ProfitDto invalid = validProfitDto();
        invalid.setProfit(new BigDecimal("0.00"));

        // Act + Assert
        mvc.perform(post("/api/profits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/profits returns 500 when the service fails, since the broad RuntimeException @ControllerAdvice intercepts the rethrown ResponseStatusException")
    void createProfit_whenServiceThrows_returns500() throws Exception {
        // Arrange — the controller rethrows the failure as ResponseStatusException(BAD_REQUEST),
        // but GlobalExceptionHandler.handleRuntimeException(RuntimeException) is resolved first by the
        // ExceptionHandlerExceptionResolver and overrides the carried status with 500.
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        when(profitService.addProfit(any(ProfitDto.class), any(UserDto.class)))
                .thenThrow(new RuntimeException("boom"));

        // Act + Assert
        mvc.perform(post("/api/profits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isInternalServerError());
    }

    // --- GET /api/profits/{id} ---

    @Test
    @DisplayName("GET /api/profits/{id} without authentication is denied (403)")
    void getProfitById_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/profits/1")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/profits/{id} returns 200 with the requested profit")
    void getProfitById_whenFound_returns200() throws Exception {
        // Arrange
        ProfitDto profit = validProfitDto();
        profit.setPurchaseId(42L);
        when(profitService.getProfitById(42L)).thenReturn(profit);

        // Act + Assert
        mvc.perform(get("/api/profits/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purchaseId").value(42));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/profits/{id} returns 500 when the service fails, since the broad RuntimeException @ControllerAdvice intercepts the rethrown ResponseStatusException(NOT_FOUND)")
    void getProfitById_whenServiceThrows_returns500() throws Exception {
        // Arrange — the controller rethrows as ResponseStatusException(NOT_FOUND), but
        // GlobalExceptionHandler.handleRuntimeException(RuntimeException) is resolved first and overrides
        // the carried 404 with a 500, because there is no specific ResponseStatusException handler.
        when(profitService.getProfitById(5L)).thenThrow(new RuntimeException("missing"));

        // Act + Assert
        mvc.perform(get("/api/profits/5")).andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/profits/{id} returns 500 even for a ResponseStatusException(FORBIDDEN), because the catch-all RuntimeException @ControllerAdvice overrides its status")
    void getProfitById_whenResponseStatusException_isOverriddenTo500() throws Exception {
        // Arrange — the controller's getProfitById re-throws a ResponseStatusException unchanged, but the
        // @ControllerAdvice still wins over ResponseStatusExceptionResolver in the resolver chain, so 403 becomes 500.
        when(profitService.getProfitById(8L))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak dostępu"));

        // Act + Assert
        mvc.perform(get("/api/profits/8")).andExpect(status().isInternalServerError());
    }

    // --- PUT /api/profits/{id} ---

    @Test
    @DisplayName("PUT /api/profits/{id} without authentication is denied (403)")
    void updateProfit_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/profits/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/profits/{id} with a valid body returns 200 and the updated profit")
    void updateProfit_withValidBody_returns200() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        ProfitDto updated = validProfitDto();
        updated.setPurchaseId(3L);
        when(profitService.updateProfit(eq(3L), any(ProfitDto.class), any(UserDto.class)))
                .thenReturn(updated);

        // Act + Assert
        mvc.perform(put("/api/profits/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purchaseId").value(3));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/profits/{id} with an invalid body returns 400")
    void updateProfit_withInvalidBody_returns400() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());

        // Act + Assert
        mvc.perform(put("/api/profits/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/profits/{id} returns 500 when the service fails (controller rethrows ResponseStatusException(INTERNAL_SERVER_ERROR), confirmed by the @ControllerAdvice mapping to 500)")
    void updateProfit_whenServiceThrows_returns500() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        when(profitService.updateProfit(anyLong(), any(ProfitDto.class), any(UserDto.class)))
                .thenThrow(new RuntimeException("boom"));

        // Act + Assert
        mvc.perform(put("/api/profits/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/profits/{id} returns 500 even for a ResponseStatusException(NOT_FOUND), because the catch-all RuntimeException @ControllerAdvice overrides its status")
    void updateProfit_whenResponseStatusException_isOverriddenTo500() throws Exception {
        // Arrange — updateProfit re-throws a ResponseStatusException unchanged, but the @ControllerAdvice
        // is consulted before ResponseStatusExceptionResolver and remaps the 404 to 500.
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        when(profitService.updateProfit(anyLong(), any(ProfitDto.class), any(UserDto.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Przychód nie istnieje"));

        // Act + Assert
        mvc.perform(put("/api/profits/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validProfitDto())))
                .andExpect(status().isInternalServerError());
    }

    // --- DELETE /api/profits/{id} ---

    @Test
    @DisplayName("DELETE /api/profits/{id} without authentication is denied (403)")
    void deleteProfit_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(delete("/api/profits/1")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/profits/{id} returns 204 No Content on success")
    void deleteProfit_whenSuccessful_returns204() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());

        // Act + Assert
        mvc.perform(delete("/api/profits/4")).andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/profits/{id} returns 500 when the service fails (controller rethrows ResponseStatusException(INTERNAL_SERVER_ERROR), confirmed by the @ControllerAdvice mapping to 500)")
    void deleteProfit_whenServiceThrows_returns500() throws Exception {
        // Arrange
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        doThrow(new RuntimeException("boom"))
                .when(profitService).deleteProfit(anyLong(), any(UserDto.class));

        // Act + Assert
        mvc.perform(delete("/api/profits/4")).andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/profits/{id} returns 500 even for a ResponseStatusException(NOT_FOUND), because the catch-all RuntimeException @ControllerAdvice overrides its status")
    void deleteProfit_whenResponseStatusException_isOverriddenTo500() throws Exception {
        // Arrange — deleteProfit re-throws a ResponseStatusException unchanged, but the @ControllerAdvice
        // is consulted before ResponseStatusExceptionResolver and remaps the 404 to 500.
        when(userService.getLoggedUser()).thenReturn(loggedUser());
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Przychód nie istnieje"))
                .when(profitService).deleteProfit(anyLong(), any(UserDto.class));

        // Act + Assert
        mvc.perform(delete("/api/profits/4")).andExpect(status().isInternalServerError());
    }

    // --- Helpers ---

    private UserDto loggedUser() {
        UserDto logged = new UserDto();
        logged.setId(1L);
        return logged;
    }

    private ProfitDto validProfitDto() {
        return new ProfitDto(
                null,
                LocalDate.of(2026, 6, 13),
                ProfitType.SPRZEDAZ_JABLEK,
                120L,
                new BigDecimal("1500.00"),
                "Sprzedaż jabłek",
                true,
                1L,
                null);
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
