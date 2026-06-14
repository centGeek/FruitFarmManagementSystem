package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.config.I18nConfig;
import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.CoordinateRepository;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.UserService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GardenerController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class, I18nConfig.class})
@DisplayName("GardenerController security and behaviour")
class GardenerControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    UserService userService;
    @MockitoBean
    CoordinateRepository coordinateRepository;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    PasswordEncoder passwordEncoder;
    @MockitoBean
    fruit.farm.management.repository.UserRepository userRepository;

    // ---------- GET /api/gardener ----------

    @Test
    @DisplayName("GET /api/gardener without authentication is denied with 403")
    void getGardenerProfile_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/gardener")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/gardener as an authenticated Gardener returns the profile (200)")
    void getGardenerProfile_withGardenerAuthority_returns200() throws Exception {
        // Arrange
        UserEntity gardener = gardenerEntity(7L);
        when(userService.findUserEntityByNickname(any())).thenReturn(Optional.of(gardener));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(gardener));

        // Act + Assert
        mvc.perform(get("/api/gardener"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.nickname").value("gardener7"));
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/gardener as any authenticated user (Employee) is allowed (200)")
    void getGardenerProfile_withEmployeeAuthority_returns200() throws Exception {
        // /api/gardener has no role restriction in SecurityConfig, only authentication is required.
        UserEntity gardener = gardenerEntity(7L);
        when(userService.findUserEntityByNickname(any())).thenReturn(Optional.of(gardener));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(gardener));

        mvc.perform(get("/api/gardener")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/gardener returns 404 when the logged-in gardener cannot be resolved")
    void getGardenerProfile_whenLoggedGardenerNotFound_returns404() throws Exception {
        // getGardenerId() throws NotFoundException which the controller maps to 404.
        when(userService.findUserEntityByNickname(any())).thenReturn(Optional.empty());

        mvc.perform(get("/api/gardener")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/gardener returns 404 when the gardener exists by nickname but not by id")
    void getGardenerProfile_whenGardenerMissingById_returns404() throws Exception {
        UserEntity gardener = gardenerEntity(7L);
        when(userService.findUserEntityByNickname(any())).thenReturn(Optional.of(gardener));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/gardener")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/gardener returns 500 when the service throws an unexpected error")
    void getGardenerProfile_whenServiceThrowsUnexpectedError_returns500() throws Exception {
        when(userService.findUserEntityByNickname(any()))
                .thenThrow(new RuntimeException("database down"));

        mvc.perform(get("/api/gardener")).andExpect(status().isInternalServerError());
    }

    // ---------- PUT /api/gardener ----------

    @Test
    @DisplayName("PUT /api/gardener without authentication is denied with 403")
    void updateGardenerProfile_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateDto("gardener7"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "gardener7", authorities = "Gardener")
    @DisplayName("PUT /api/gardener with a valid body updates the profile and returns 200")
    void updateGardenerProfile_withValidBody_returns200() throws Exception {
        // Arrange
        UserEntity existing = gardenerEntity(7L);
        when(userService.findUserEntityByNickname("gardener7")).thenReturn(Optional.of(existing));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(existing));
        when(coordinateRepository.addCoordinate(any())).thenReturn(new CoordinateEntity(50.0, 19.0, null));

        UserDto body = validUpdateDto("gardener7");

        // Act + Assert
        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profil został zaktualizowany pomyślnie!"));

        verify(userService).update(eq(7L), any(UserDto.class), any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/gardener with an invalid body (blank nickname) returns 400 and never updates")
    void updateGardenerProfile_withInvalidBody_returns400() throws Exception {
        UserDto invalid = validUpdateDto("gardener7");
        invalid.setNickname(""); // violates @NotBlank

        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());

        verify(userService, never()).update(any(), any(), any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/gardener returns 400 when password and confirmPassword do not match")
    void updateGardenerProfile_withMismatchedPasswords_returns400() throws Exception {
        UserDto body = validUpdateDto("gardener7");
        body.setPassword("secret123");
        body.setConfirmPassword("different");

        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Hasła nie są zgodne"));

        verify(userService, never()).update(any(), any(), any());
    }

    @Test
    @WithMockUser(username = "gardener7", authorities = "Gardener")
    @DisplayName("PUT /api/gardener returns 409 when the chosen nickname is already taken by another user")
    void updateGardenerProfile_withTakenNickname_returns409() throws Exception {
        // Arrange: logged in as gardener7, requesting to rename to an existing nickname "taken".
        UserEntity existing = gardenerEntity(7L);
        when(userService.findUserEntityByNickname("gardener7")).thenReturn(Optional.of(existing));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(existing));
        when(coordinateRepository.addCoordinate(any())).thenReturn(new CoordinateEntity(50.0, 19.0, null));
        when(userService.findUserEntityByNickname("taken")).thenReturn(Optional.of(gardenerEntity(99L)));

        UserDto body = validUpdateDto("taken");

        // Act + Assert
        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Ta nazwa użytkownika jest już zajęta"));

        verify(userService, never()).update(any(), any(), any());
    }

    @Test
    @WithMockUser(username = "gardener7", authorities = "Gardener")
    @DisplayName("PUT /api/gardener returns 404 when the gardener to update cannot be found by id")
    void updateGardenerProfile_whenGardenerMissingById_returns404() throws Exception {
        UserEntity existing = gardenerEntity(7L);
        when(userService.findUserEntityByNickname("gardener7")).thenReturn(Optional.of(existing));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.empty());

        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateDto("gardener7"))))
                .andExpect(status().isNotFound());

        verify(userService, never()).update(any(), any(), any());
    }

    @Test
    @WithMockUser(username = "gardener7", authorities = "Gardener")
    @DisplayName("PUT /api/gardener returns 500 with an error body when the update service fails unexpectedly")
    void updateGardenerProfile_whenUpdateServiceFails_returns500() throws Exception {
        UserEntity existing = gardenerEntity(7L);
        when(userService.findUserEntityByNickname("gardener7")).thenReturn(Optional.of(existing));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(existing));
        when(coordinateRepository.addCoordinate(any())).thenReturn(new CoordinateEntity(50.0, 19.0, null));
        when(userService.update(eq(7L), any(UserDto.class), any()))
                .thenThrow(new RuntimeException("boom"));

        mvc.perform(put("/api/gardener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateDto("gardener7"))))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Błąd serwera podczas zapisu zmian: boom"));
    }

    // ---------- GET /api/gardener/location ----------

    @Test
    @DisplayName("GET /api/gardener/location without authentication is denied with 403")
    void getUserLocationInformation_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/gardener/location")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/gardener/location returns the gardener's location for an authenticated user (200)")
    void getUserLocationInformation_withGardenerAuthority_returns200() throws Exception {
        // Arrange
        UserEntity gardener = gardenerEntity(7L);
        gardener.setCoordinateEntity(new CoordinateEntity(50.06, 19.94, null));
        gardener.setLocalityName("Kraków");
        when(userService.findUserEntityByNickname(any())).thenReturn(Optional.of(gardener));

        // Act + Assert
        mvc.perform(get("/api/gardener/location"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.locationName").value("Kraków"))
                .andExpect(jsonPath("$.coordinateDTO.latitude").value(50.06))
                .andExpect(jsonPath("$.coordinateDTO.longitude").value(19.94));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/gardener/location tolerates a missing coordinate by emitting a null coordinateDTO (200)")
    void getUserLocationInformation_withoutCoordinate_returnsNullCoordinate() throws Exception {
        UserEntity gardener = gardenerEntity(7L);
        gardener.setCoordinateEntity(null);
        gardener.setLocalityName("Brak");
        when(userService.findUserEntityByNickname(any())).thenReturn(Optional.of(gardener));

        // Jackson includes null properties by default, so coordinateDTO is present with a null value.
        mvc.perform(get("/api/gardener/location"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.locationName").value("Brak"))
                .andExpect(jsonPath("$.coordinateDTO").value(nullValue()));
    }

    // ---------- token-driven security (mirrors the sibling test) ----------

    @Test
    @DisplayName("a blocked user with a valid token is denied (403)")
    void getGardenerProfile_withValidTokenButBlockedUser_isDenied() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findActiveByNickname("blocked")).thenReturn(Optional.of(false));

        mvc.perform(get("/api/gardener").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches the endpoint (200)")
    void getGardenerProfile_withValidTokenAndActiveUser_returns200() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findActiveByNickname("active")).thenReturn(Optional.of(true));

        UserEntity gardener = gardenerEntity(7L);
        when(userService.findUserEntityByNickname("active")).thenReturn(Optional.of(gardener));
        when(userService.findUserEntityById(7L)).thenReturn(Optional.of(gardener));

        mvc.perform(get("/api/gardener").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    // ---------- helpers ----------

    private UserEntity gardenerEntity(Long id) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName("Jan");
        user.setSurname("Sadownik");
        user.setNickname("gardener" + id);
        user.setPhoneNumber("123456789");
        user.setEmail("gardener" + id + "@example.com");
        user.setCreationDate(LocalDate.of(2024, 1, 1));
        user.setRole(new RoleEntity(2L, "Gardener"));
        user.setActive(true);
        return user;
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }

    private UserDto validUpdateDto(String nickname) {
        UserDto dto = new UserDto();
        dto.setName("Jan");
        dto.setSurname("Sadownik");
        dto.setEmail("jan@example.com");
        dto.setNickname(nickname);
        dto.setPhoneNumber("123456789");
        dto.setLocalityName("Kraków");
        dto.setCoordinateDTO(new CoordinateDto(50.0, 19.0));
        return dto;
    }
}
