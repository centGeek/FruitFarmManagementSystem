package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.SectorDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.PlantType;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SectorController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("SectorController security and request handling")
class SectorControllerTest {

    @Autowired
    MockMvc mvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Direct collaborators of the controller under test
    @MockitoBean
    SectorService sectorService;
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

    // ----- GET /api/sectors : authorization -----

    @Test
    @DisplayName("GET /api/sectors without authentication is denied (403)")
    void getAllSectors_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/sectors")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/sectors as a Gardener returns 200")
    void getAllSectors_withGardenerAuthority_returns200() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.getAllActiveSectorsByUserId(1L)).thenReturn(List.of());

        mvc.perform(get("/api/sectors"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/sectors as an Employee is allowed (any authenticated user, 200)")
    void getAllSectors_withEmployeeAuthority_returns200() throws Exception {
        // /api/sectors/** has no role matcher in SecurityConfig, so it falls through to anyRequest().authenticated().
        UserDto logged = new UserDto();
        logged.setId(7L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.getAllActiveSectorsByUserId(7L)).thenReturn(List.of());

        mvc.perform(get("/api/sectors")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/sectors returns 500 when the service throws")
    void getAllSectors_whenServiceThrows_returns500() throws Exception {
        // The controller swallows the exception and maps it to 500 internally.
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.getAllActiveSectorsByUserId(1L))
                .thenThrow(new RuntimeException("boom"));

        mvc.perform(get("/api/sectors")).andExpect(status().isInternalServerError());
    }

    // ----- GET /api/sectors/archived : authorization -----

    @Test
    @DisplayName("GET /api/sectors/archived without authentication is denied (403)")
    void getArchivedSectors_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/sectors/archived")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/sectors/archived as a Gardener returns 200")
    void getArchivedSectors_withGardenerAuthority_returns200() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.getAllArchivedSectorsByUserId(1L)).thenReturn(List.of());

        mvc.perform(get("/api/sectors/archived")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/sectors/archived returns 500 when the service throws")
    void getArchivedSectors_whenServiceThrows_returns500() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.getAllArchivedSectorsByUserId(1L))
                .thenThrow(new RuntimeException("boom"));

        mvc.perform(get("/api/sectors/archived")).andExpect(status().isInternalServerError());
    }

    // ----- POST /api/sectors : authorization + validation -----

    @Test
    @DisplayName("POST /api/sectors without authentication is denied (403)")
    void createSector_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(post("/api/sectors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSectorDto())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/sectors with a valid body as a Gardener returns 201")
    void createSector_withValidBody_returns201() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.createSector(any(SectorDto.class), any(UserDto.class)))
                .thenReturn(validSectorDto());

        mvc.perform(post("/api/sectors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSectorDto())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Sektor jabłoni"))
                .andExpect(jsonPath("$.plantType").value("JABŁOŃ"))
                .andExpect(jsonPath("$.variety").value("GALA"));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/sectors with a blank description returns 400")
    void createSector_withBlankDescription_returns400() throws Exception {
        SectorDto invalid = validSectorDto();
        invalid.setDescription("   ");

        mvc.perform(post("/api/sectors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest(name = "{0} coordinates -> 400")
    @ValueSource(ints = {1, 3, 5})
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/sectors with a coordinate count outside [4, 4] returns 400")
    void createSector_withCoordinateCountOutsideBounds_returns400(int coordinateCount) throws Exception {
        // @Size(min = 4) is violated below 4 points, @Size(max = 4) above 4 points.
        List<CoordinateDto> coordinates = new java.util.ArrayList<>();
        for (int i = 0; i < coordinateCount; i++) {
            coordinates.add(new CoordinateDto(50.0 + i * 0.1, 19.0 + i * 0.1));
        }
        SectorDto invalid = validSectorDto();
        invalid.setCoordinates(coordinates);

        mvc.perform(post("/api/sectors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/sectors with empty coordinates returns 400")
    void createSector_withEmptyCoordinates_returns400() throws Exception {
        // @NotEmpty on coordinates rejects an empty list.
        SectorDto invalid = validSectorDto();
        invalid.setCoordinates(List.of());

        mvc.perform(post("/api/sectors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/sectors returns 500 when the service throws")
    void createSector_whenServiceThrows_returns500() throws Exception {
        // The controller catches all exceptions from the service and maps them to 500.
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.createSector(any(SectorDto.class), any(UserDto.class)))
                .thenThrow(new RuntimeException("boom"));

        mvc.perform(post("/api/sectors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSectorDto())))
                .andExpect(status().isInternalServerError());
    }

    // ----- PUT /api/sectors/{id} : authorization + validation -----

    @Test
    @DisplayName("PUT /api/sectors/{id} without authentication is denied (403)")
    void updateSector_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/sectors/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSectorDto())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/sectors/{id} with a valid body returns 200")
    void updateSector_withValidBody_returns200() throws Exception {
        // updateSector returns void; default Mockito behaviour leaves it a no-op.
        // The controller binds the path id into the returned DTO via sectorDto.setId(id).
        mvc.perform(put("/api/sectors/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSectorDto())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.description").value("Sektor jabłoni"));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/sectors/{id} with a blank description returns 400")
    void updateSector_withBlankDescription_returns400() throws Exception {
        SectorDto invalid = validSectorDto();
        invalid.setDescription("");

        mvc.perform(put("/api/sectors/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/sectors/{id} returns 500 when the service throws (mapped by GlobalExceptionHandler)")
    void updateSector_whenServiceThrows_returns500() throws Exception {
        // updateSector has no try/catch, so a RuntimeException propagates to GlobalExceptionHandler -> 500.
        org.mockito.Mockito.doThrow(new RuntimeException("Sector not found"))
                .when(sectorService).updateSector(any(SectorDto.class));

        mvc.perform(put("/api/sectors/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validSectorDto())))
                .andExpect(status().isInternalServerError());
    }

    // ----- Token-driven authentication via JwtAuthenticationFilter -----

    @Test
    @DisplayName("a blocked user with a valid token is denied (403)")
    void getAllSectors_withValidTokenButBlockedUser_isDenied() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("blocked")).thenReturn(Optional.of(userWithActive(false)));

        mvc.perform(get("/api/sectors").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active Gardener authenticated via token reaches the endpoint (200)")
    void getAllSectors_withValidTokenAndActiveUser_returns200() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findByNickname("active")).thenReturn(Optional.of(userWithActive(true)));

        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(sectorService.getAllActiveSectorsByUserId(anyLong())).thenReturn(List.of());

        mvc.perform(get("/api/sectors").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    // ----- helpers -----

    private SectorDto validSectorDto() {
        // Polish domain string matches the feature language; coordinates satisfy @Size(min=4, max=4).
        return new SectorDto(
                "Sektor jabłoni",
                PlantType.JABŁOŃ,
                "GALA",
                List.of(
                        new CoordinateDto(50.0, 19.0),
                        new CoordinateDto(50.1, 19.0),
                        new CoordinateDto(50.1, 19.1),
                        new CoordinateDto(50.0, 19.1)
                ));
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
