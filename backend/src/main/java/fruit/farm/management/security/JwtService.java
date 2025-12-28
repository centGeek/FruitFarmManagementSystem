package fruit.farm.management.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;

@Service
@Slf4j
public class JwtService {

    private final Key SECRET_KEY;
    private final long ACCESS_TOKEN_VALIDITY = 15 * 60 * 1000;
    private final long REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 7 dni

    public JwtService(@Value("${jwt.secret.key}") String secret) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            log.error("JWT token is too short.");
            throw new IllegalArgumentException("JWT Secret Key is too short.");
        }
        this.SECRET_KEY = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long id, String nickname, List<String> roles) {
        return Jwts.builder()
                .setSubject(nickname)
                .claim("id", id)
                .claim("roles", roles)
                .claim("type", "access")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_VALIDITY))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(Long id, String nickname, List<String> roles) {
        return Jwts.builder()
                .setSubject(nickname)
                .claim("id", id)
                .claim("roles", roles)
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_VALIDITY))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(SECRET_KEY).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser().setSigningKey(SECRET_KEY).build()
                    .parseClaimsJws(token).getBody();
            return "refresh".equals(claims.get("type"));
        } catch (Exception e) {
            return false;
        }
    }

    public String getNicknameFromToken(String token) {
        return Jwts.parser().setSigningKey(SECRET_KEY).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parser().setSigningKey(SECRET_KEY).build()
                .parseClaimsJws(token).getBody();
        return (List<String>) claims.get("roles");
    }

    public Long getIdFromToken(String token) {
        Claims claims = Jwts.parser().setSigningKey(SECRET_KEY).build()
                .parseClaimsJws(token).getBody();
        return claims.get("id", Long.class);
    }
}
