package fruit.farm.management.controller;

import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
@Slf4j
public class AuthController {

    private AuthenticationManager authenticationManager;
    private JwtService jwtService;
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletResponse response) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getNickname(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        Optional<UserEntity> userByNickname = userService.findByNickname(user.getUsername());
        String token = jwtService.generateAccessToken(
                userByNickname.get().getId(),
                user.getUsername(),
                user.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList())
        );

        String refreshToken = jwtService.generateRefreshToken(
                userByNickname.get().getId(),
                user.getUsername(), user.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList())
        );

        Cookie cookie = new Cookie("accessToken", token);
        cookie.setPath("/");
        cookie.setMaxAge(3600);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);

        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(7 * 24 * 60 * 60);
        refreshCookie.setHttpOnly(true);

        response.addCookie(refreshCookie);

        return ResponseEntity.ok(new AuthResponse(token, request.getNickname()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDto request, HttpServletResponse response) {
        try {
            UserEntity savedUser = userService.registerUser(request);

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getNickname(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();
            List<String> roles = user.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            String token = jwtService.generateAccessToken(savedUser.getId(), user.getUsername(), roles);
            String refreshToken = jwtService.generateRefreshToken(savedUser.getId(), user.getUsername(), roles);

            Cookie cookie = new Cookie("accessToken", token);
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(3600);
            response.addCookie(cookie);

            Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
            refreshCookie.setPath("/");
            refreshCookie.setHttpOnly(true);
            refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7 dni
            response.addCookie(refreshCookie);

            return ResponseEntity.ok(new AuthResponse(token, request.getNickname()));

        } catch (Exception e) {
            log.error("Registration error: ", e);
            return ResponseEntity.badRequest().body(new ApiErrorResponse("Błąd podczas rejestracji"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Czyścimy Access Token
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        response.addCookie(cookie);

        Cookie refreshCookie = new Cookie("refreshToken", null);
        refreshCookie.setMaxAge(0);
        refreshCookie.setPath("/");
        refreshCookie.setHttpOnly(true);
        response.addCookie(refreshCookie);

        return ResponseEntity.ok("Successfully logged out");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(value = "refreshToken", required = false) String refreshToken,
                                     HttpServletResponse response) {

        if (refreshToken == null || !jwtService.validateToken(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).body("Invalid or missing refresh token");
        }

        Long userId = jwtService.getIdFromToken(refreshToken);
        String nickname = jwtService.getNicknameFromToken(refreshToken);
        UserEntity user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getNickname(),
                List.of(user.getRole().getRoleName())
        );

        Cookie cookie = new Cookie("accessToken", newAccessToken);
        cookie.setPath("/");
        cookie.setMaxAge(15 * 60);
        response.addCookie(cookie);

        return ResponseEntity.ok(new AuthResponse(newAccessToken, nickname));
    }


    @Data
    public static class AuthRequest {
        private String nickname;
        private String password;
    }

    @Data
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String email;
    }

}
