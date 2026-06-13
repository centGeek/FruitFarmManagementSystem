package fruit.farm.management.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtService")
class JwtServiceTest {

    // Must match jwt.secret.key in src/test/resources/application.yml.
    private static final String SECRET =
            "9683bc6f47cc73bd0dc0fd3738cc59ca1a15637eee20af3dc7b9aa1165716db7ba98e845";

    private static final Long USER_ID = 42L;
    private static final String NICKNAME = "ogrodnik";
    private static final List<String> ROLES = List.of("Gardener", "Employee");

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET);
    }

    /**
     * Builds a JWT whose expiration is already in the past, signed with the SAME secret the
     * service under test uses. This deterministically exercises the expiry branch without
     * sleeping. Reflection on the validity fields is NOT used on purpose: those fields are
     * {@code final long} initialised from compile-time constant expressions, so javac inlines
     * their values into the generator methods' bytecode and {@code ReflectionTestUtils.setField}
     * has no effect on the produced token.
     */
    private static String alreadyExpiredToken(String type) {
        Key signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        long oneMinuteAgo = System.currentTimeMillis() - 60_000L;
        return Jwts.builder()
                .setSubject(NICKNAME)
                .claim("id", USER_ID)
                .claim("roles", ROLES)
                .claim("type", type)
                .setIssuedAt(new Date(oneMinuteAgo - 1_000L))
                .setExpiration(new Date(oneMinuteAgo))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    @DisplayName("constructor rejects a secret shorter than 32 bytes")
    void constructor_whenSecretTooShort_throwsIllegalArgument() {
        // Arrange
        String shortSecret = "too-short-key";

        // Act / Assert
        assertThatThrownBy(() -> new JwtService(shortSecret))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("too short");
    }

    @Test
    @DisplayName("generateAccessToken produces a token that validates and round-trips its claims")
    void generateAccessToken_whenGenerated_roundTripsClaimsAndIsNotRefresh() {
        // Arrange / Act
        String token = jwtService.generateAccessToken(USER_ID, NICKNAME, ROLES);

        // Assert
        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.getNicknameFromToken(token)).isEqualTo(NICKNAME);
        assertThat(jwtService.getIdFromToken(token)).isEqualTo(USER_ID);
        assertThat(jwtService.getRolesFromToken(token)).containsExactlyElementsOf(ROLES);
        assertThat(jwtService.isRefreshToken(token)).isFalse();
    }

    @Test
    @DisplayName("generateRefreshToken produces a token recognised as a refresh token that round-trips its claims")
    void generateRefreshToken_whenGenerated_isRefreshTokenAndRoundTripsClaims() {
        // Arrange / Act
        String token = jwtService.generateRefreshToken(USER_ID, NICKNAME, ROLES);

        // Assert
        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.isRefreshToken(token)).isTrue();
        assertThat(jwtService.getNicknameFromToken(token)).isEqualTo(NICKNAME);
        assertThat(jwtService.getIdFromToken(token)).isEqualTo(USER_ID);
        assertThat(jwtService.getRolesFromToken(token)).containsExactlyElementsOf(ROLES);
    }

    @Test
    @DisplayName("isRefreshToken returns false for an access token")
    void isRefreshToken_whenAccessToken_returnsFalse() {
        // Arrange
        String accessToken = jwtService.generateAccessToken(USER_ID, NICKNAME, ROLES);

        // Act / Assert
        assertThat(jwtService.isRefreshToken(accessToken)).isFalse();
    }

    @Test
    @DisplayName("getRolesFromToken returns an empty list when no roles were embedded")
    void getRolesFromToken_whenNoRoles_returnsEmptyList() {
        // Arrange
        String token = jwtService.generateAccessToken(USER_ID, NICKNAME, List.of());

        // Act
        List<String> roles = jwtService.getRolesFromToken(token);

        // Assert
        assertThat(roles).isEmpty();
    }

    @ParameterizedTest(name = "validateToken rejects \"{0}\"")
    @ValueSource(strings = {"not-a-jwt", "abc.def.ghi", "", "   "})
    @DisplayName("validateToken returns false for garbage input")
    void validateToken_whenGarbageInput_returnsFalse(String garbage) {
        // Act / Assert
        assertThat(jwtService.validateToken(garbage)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false when the token signature has been tampered with")
    void validateToken_whenSignatureTampered_returnsFalse() {
        // Arrange
        String token = jwtService.generateAccessToken(USER_ID, NICKNAME, ROLES);
        // Flip the last character of the signature segment to invalidate it.
        char lastChar = token.charAt(token.length() - 1);
        char replacement = (lastChar == 'a') ? 'b' : 'a';
        String tampered = token.substring(0, token.length() - 1) + replacement;

        // Act / Assert
        assertThat(jwtService.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for a token signed with a different secret")
    void validateToken_whenSignedWithDifferentSecret_returnsFalse() {
        // Arrange
        JwtService foreignSigner = new JwtService(
                "a-completely-different-secret-key-of-sufficient-length-1234567890");
        String foreignToken = foreignSigner.generateAccessToken(USER_ID, NICKNAME, ROLES);

        // Act / Assert
        assertThat(jwtService.validateToken(foreignToken)).isFalse();
    }

    @Test
    @DisplayName("validateToken returns false for an expired access token")
    void validateToken_whenAccessTokenExpired_returnsFalse() {
        // Arrange: a token whose expiration is already in the past, signed with the same secret.
        String expiredToken = alreadyExpiredToken("access");

        // Act / Assert
        assertThat(jwtService.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("isRefreshToken returns false for an expired refresh token")
    void isRefreshToken_whenRefreshTokenExpired_returnsFalse() {
        // Arrange: a refresh token whose expiration is already in the past.
        String expiredRefresh = alreadyExpiredToken("refresh");

        // Act / Assert
        assertThat(jwtService.isRefreshToken(expiredRefresh)).isFalse();
    }
}
