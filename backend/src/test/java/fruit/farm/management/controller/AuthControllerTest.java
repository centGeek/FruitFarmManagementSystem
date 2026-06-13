package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.security.CookieProperties;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("AuthController endpoints (/api/auth/** is permitAll)")
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    // Direct collaborators of AuthController
    @MockitoBean
    AuthenticationManager authenticationManager;
    @MockitoBean
    UserService userService;
    @MockitoBean
    CookieProperties cookieProperties;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @MockitoBean
    fruit.farm.management.repository.UserRepository userRepository;

    // ---------- POST /api/auth/login ----------

    @Test
    @DisplayName("POST /api/auth/login with valid credentials returns 200 with token and sets both auth cookies")
    void login_withValidCredentials_returns200AndSetsCookies() throws Exception {
        // Arrange
        stubCookieProperties();
        Authentication authentication = authenticationFor("jankowalski", "Gardener");
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userService.findUserNickname("jankowalski")).thenReturn(userDtoWithId(7L));
        when(jwtService.generateAccessToken(7L, "jankowalski", List.of("Gardener"))).thenReturn("access-jwt");
        when(jwtService.generateRefreshToken(7L, "jankowalski", List.of("Gardener"))).thenReturn("refresh-jwt");

        AuthController.AuthRequest request = new AuthController.AuthRequest();
        request.setNickname("jankowalski");
        request.setPassword("secret123");

        // Act / Assert
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-jwt"))
                .andExpect(jsonPath("$.nickname").value("jankowalski"))
                .andExpect(cookie().value("accessToken", "access-jwt"))
                .andExpect(cookie().httpOnly("accessToken", true))
                .andExpect(cookie().maxAge("accessToken", 3600))
                .andExpect(cookie().value("refreshToken", "refresh-jwt"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().maxAge("refreshToken", 7 * 24 * 60 * 60));
    }

    @Test
    @DisplayName("POST /api/auth/login with bad credentials surfaces the authentication failure as 500")
    void login_withBadCredentials_returns500() throws Exception {
        // Arrange: AuthenticationManager throws; no @ExceptionHandler covers it, so the RuntimeException handler maps it to 500.
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        AuthController.AuthRequest request = new AuthController.AuthRequest();
        request.setNickname("jankowalski");
        request.setPassword("wrong");

        // Act / Assert
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Bad credentials"))
                // A failed authentication must not leak any auth cookies.
                .andExpect(cookie().doesNotExist("accessToken"))
                .andExpect(cookie().doesNotExist("refreshToken"));
    }

    // ---------- POST /api/auth/register ----------

    @Test
    @DisplayName("POST /api/auth/register registers then logs in, returning 200 with cookies")
    void register_withValidPayload_returns200AndLogsIn() throws Exception {
        // Arrange
        stubCookieProperties();
        Authentication authentication = authenticationFor("nowyuser", "Gardener");
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userService.findUserNickname("nowyuser")).thenReturn(userDtoWithId(11L));
        when(jwtService.generateAccessToken(11L, "nowyuser", List.of("Gardener"))).thenReturn("access-jwt");
        when(jwtService.generateRefreshToken(11L, "nowyuser", List.of("Gardener"))).thenReturn("refresh-jwt");

        UserDto request = new UserDto();
        request.setName("Jan");
        request.setSurname("Nowak");
        request.setNickname("nowyuser");
        request.setPassword("secret123");

        // Act / Assert
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-jwt"))
                .andExpect(jsonPath("$.nickname").value("nowyuser"))
                .andExpect(cookie().value("accessToken", "access-jwt"))
                .andExpect(cookie().value("refreshToken", "refresh-jwt"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 with a Polish error message when registration fails")
    void register_whenRegistrationFails_returns400WithPolishMessage() throws Exception {
        // Arrange: registerUser throws; the controller catches it and returns badRequest with a Polish prefix.
        when(userService.registerUser(any()))
                .thenThrow(new NotFoundException("Nazwa użytkownika już jest zajęta"));

        UserDto request = new UserDto();
        request.setName("Jan");
        request.setSurname("Nowak");
        request.setNickname("zajety");
        request.setPassword("secret123");

        // Act / Assert
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Błąd podczas rejestracji: Nazwa użytkownika już jest zajęta"));
    }

    // ---------- POST /api/auth/logout ----------

    @Test
    @DisplayName("POST /api/auth/logout returns 200 and a confirmation message")
    void logout_always_returns200WithMessage() throws Exception {
        // Act / Assert: UserService.logout is a void mock; just verify the response.
        mvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Successfully logged out"));
    }

    // ---------- POST /api/auth/refresh ----------

    @Test
    @DisplayName("POST /api/auth/refresh with no refresh token cookie returns 401")
    void refresh_withoutCookie_returns401() throws Exception {
        // Act / Assert
        mvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or missing refresh token"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh with an invalid refresh token returns 401")
    void refresh_withInvalidToken_returns401() throws Exception {
        // Arrange
        when(jwtService.validateToken("bad-refresh")).thenReturn(false);

        // Act / Assert
        mvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", "bad-refresh")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or missing refresh token"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh with a valid access-type (non-refresh) token returns 401")
    void refresh_withAccessTypeToken_returns401() throws Exception {
        // Arrange: token is valid but not of the refresh type.
        when(jwtService.validateToken("access-token")).thenReturn(true);
        when(jwtService.isRefreshToken("access-token")).thenReturn(false);

        // Act / Assert
        mvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", "access-token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or missing refresh token"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh for a blocked user returns 401")
    void refresh_whenUserBlocked_returns401() throws Exception {
        // Arrange
        when(jwtService.validateToken("refresh-jwt")).thenReturn(true);
        when(jwtService.isRefreshToken("refresh-jwt")).thenReturn(true);
        when(jwtService.getIdFromToken("refresh-jwt")).thenReturn(5L);
        when(jwtService.getNicknameFromToken("refresh-jwt")).thenReturn("blocked");
        when(userService.findUserEntityById(5L)).thenReturn(Optional.of(userEntity("blocked", false)));

        // Act / Assert
        mvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", "refresh-jwt")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Account is blocked"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh for an active user returns 200 with a new access token cookie")
    void refresh_whenUserActive_returns200AndNewAccessCookie() throws Exception {
        // Arrange
        stubCookieProperties();
        when(jwtService.validateToken("refresh-jwt")).thenReturn(true);
        when(jwtService.isRefreshToken("refresh-jwt")).thenReturn(true);
        when(jwtService.getIdFromToken("refresh-jwt")).thenReturn(5L);
        when(jwtService.getNicknameFromToken("refresh-jwt")).thenReturn("active");
        when(userService.findUserEntityById(5L)).thenReturn(Optional.of(userEntity("active", true)));
        when(jwtService.generateAccessToken(5L, "active", List.of("Gardener"))).thenReturn("new-access-jwt");

        // Act / Assert
        mvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", "refresh-jwt")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new-access-jwt"))
                .andExpect(jsonPath("$.nickname").value("active"))
                .andExpect(cookie().value("accessToken", "new-access-jwt"))
                .andExpect(cookie().httpOnly("accessToken", true))
                .andExpect(cookie().maxAge("accessToken", 15 * 60))
                // Only the short-lived access cookie is reissued on refresh.
                .andExpect(cookie().doesNotExist("refreshToken"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh for a missing user surfaces the lookup failure as 500")
    void refresh_whenUserNotFound_returns500() throws Exception {
        // Arrange: token passes validation but the user no longer exists, so the controller throws a RuntimeException.
        when(jwtService.validateToken("refresh-jwt")).thenReturn(true);
        when(jwtService.isRefreshToken("refresh-jwt")).thenReturn(true);
        when(jwtService.getIdFromToken("refresh-jwt")).thenReturn(99L);
        when(jwtService.getNicknameFromToken("refresh-jwt")).thenReturn("ghost");
        when(userService.findUserEntityById(99L)).thenReturn(Optional.empty());

        // Act / Assert
        mvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", "refresh-jwt")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    // ---------- GET /api/auth/verify ----------

    @Test
    @DisplayName("GET /api/auth/verify with no access token cookie returns 401 and authenticated=false")
    void verify_withoutCookie_returns401Unauthenticated() throws Exception {
        // Act / Assert
        mvc.perform(get("/api/auth/verify"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.nickname").doesNotExist())
                .andExpect(jsonPath("$.roles").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/auth/verify with an invalid token returns 401 and authenticated=false")
    void verify_withInvalidToken_returns401Unauthenticated() throws Exception {
        // Arrange
        when(jwtService.validateToken("bad")).thenReturn(false);

        // Act / Assert
        mvc.perform(get("/api/auth/verify").cookie(new Cookie("accessToken", "bad")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    @DisplayName("GET /api/auth/verify with a valid token returns 200 with nickname and roles")
    void verify_withValidToken_returns200WithIdentity() throws Exception {
        // Arrange
        when(jwtService.validateToken("good")).thenReturn(true);
        when(jwtService.getNicknameFromToken("good")).thenReturn("active");
        when(jwtService.getRolesFromToken("good")).thenReturn(List.of("Gardener"));

        // Act / Assert
        mvc.perform(get("/api/auth/verify").cookie(new Cookie("accessToken", "good")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.nickname").value("active"))
                .andExpect(jsonPath("$.roles[0]").value("Gardener"));
    }

    @Test
    @DisplayName("GET /api/auth/verify returns 401 when reading claims from a valid token throws")
    void verify_whenClaimExtractionThrows_returns401() throws Exception {
        // Arrange: token validates but claim extraction blows up; the controller maps that to 401.
        when(jwtService.validateToken("good")).thenReturn(true);
        when(jwtService.getNicknameFromToken("good")).thenThrow(new RuntimeException("corrupt claims"));

        // Act / Assert
        mvc.perform(get("/api/auth/verify").cookie(new Cookie("accessToken", "good")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.nickname").doesNotExist())
                .andExpect(jsonPath("$.roles").doesNotExist());
    }

    // ---------- /api/auth/** is public: the JWT filter must not gate it ----------

    @Test
    @DisplayName("GET /api/auth/verify is reachable without any authentication (permitAll), unlike protected routes")
    void verify_isPublic_reachableAnonymously() throws Exception {
        // Arrange: no token at all; a 401 body (not a 403 from the filter chain) proves the route is permitted.
        // Act / Assert
        mvc.perform(get("/api/auth/verify"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("Content-Type"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    // ---------- helpers ----------

    private void stubCookieProperties() {
        when(cookieProperties.isSecure()).thenReturn(false);
        when(cookieProperties.getSameSite()).thenReturn("Lax");
    }

    private Authentication authenticationFor(String nickname, String authority) {
        User principal = new User(
                nickname,
                "encoded-password",
                List.of(new SimpleGrantedAuthority(authority)));
        return new UsernamePasswordAuthenticationToken(
                principal, "encoded-password", principal.getAuthorities());
    }

    private UserDto userDtoWithId(Long id) {
        UserDto dto = new UserDto();
        dto.setId(id);
        return dto;
    }

    private UserEntity userEntity(String nickname, boolean active) {
        UserEntity user = new UserEntity();
        user.setId(5L);
        user.setNickname(nickname);
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
