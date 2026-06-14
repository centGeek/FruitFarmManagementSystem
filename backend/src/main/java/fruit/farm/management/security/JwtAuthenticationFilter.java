package fruit.farm.management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import fruit.farm.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String token = getTokenFromCookies(request);

            if (token != null && jwtService.validateToken(token)) {
                String nickname = jwtService.getNicknameFromToken(token);
                List<String> roles = jwtService.getRolesFromToken(token);

                log.debug("Valid token for user: {}, roles: {}", nickname, roles);

                boolean blocked = userRepository.findActiveByNickname(nickname)
                        .map(active -> !active)
                        .orElse(true);

                if (blocked) {
                    log.warn("Rejecting request for blocked or unknown user: {}", nickname);
                    SecurityContextHolder.clearContext();
                } else {
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(nickname, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Authentication set successfully for user: {}", nickname);
                }
            } else if (token != null) {
                log.debug("Invalid or expired token");
            } else {
                log.debug("No token found in cookies");
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("JWT authentication error: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Pobiera access token z cookies
     */
    private String getTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    log.debug("Found accessToken cookie");
                    return cookie.getValue();
                }
            }
        }
        log.debug("No accessToken cookie found");
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/");
    }
}