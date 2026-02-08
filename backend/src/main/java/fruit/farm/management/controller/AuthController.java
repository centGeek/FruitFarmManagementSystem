package fruit.farm.management.controller;

import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
                new UsernamePasswordAuthenticationToken(request.getNickname(), request.getPassword()));
        User user = (User) authentication.getPrincipal();
        UserDto userByNickname = userService.findUserNickname(user.getUsername());
        String token = jwtService.generateAccessToken(
                userByNickname.getId(),
                user.getUsername(),
                user.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList())
        );

        String refreshToken = jwtService.generateRefreshToken(
                userByNickname.getId(),
                user.getUsername(), user.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList())
        );

        ResponseCookie accessCookie = ResponseCookie.from("accessToken", token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(3600)
                .sameSite("Lax")
                .build();

        return getResponseEntity(response, refreshToken, accessCookie);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDto request, HttpServletResponse response) {

        try {
            UserDto savedUser = userService.registerUser(request);

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getNickname(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();
            List<String> roles = user.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            String token = jwtService.generateAccessToken(savedUser.getId(), user.getUsername(), roles);
            String refreshToken = jwtService.generateRefreshToken(savedUser.getId(), user.getUsername(), roles);

            ResponseCookie accessCookie = ResponseCookie.from("accessToken", token)
                    .httpOnly(true).secure(false).path("/").maxAge(60 * 15)
                    .sameSite("Lax").build();

            return getResponseEntity(response, refreshToken, accessCookie);

        } catch (Exception e) {
            log.error("Registration error: ", e);
            return ResponseEntity.badRequest().body(new ApiErrorResponse("Błąd podczas rejestracji"));
        }
    }

    @NotNull
    private ResponseEntity<?> getResponseEntity(HttpServletResponse response, String refreshToken, ResponseCookie accessCookie) {

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok("success");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {

        userService.logout(response);

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
        UserEntity user = userService.findUserEntityById(userId)
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

    @GetMapping("/verify")
    public ResponseEntity<?> verify(@CookieValue(value = "accessToken", required = false) String token) {

        log.info("User is being validated.");
        if (token == null || !jwtService.validateToken(token)) {
            return ResponseEntity.status(401).body(new VerifyResponse(false, null, null));
        }

        try {
            String nickname = jwtService.getNicknameFromToken(token);
            List<String> roles = jwtService.getRolesFromToken(token);

            return ResponseEntity.ok(new VerifyResponse(true, nickname, roles));
        } catch (Exception e) {
            log.error("Błąd podczas weryfikacji tokenu: ", e);
            return ResponseEntity.status(401).body(new VerifyResponse(false, null, null));
        }
    }

    @Data
    @AllArgsConstructor
    public static class VerifyResponse {

        private boolean authenticated;
        private String nickname;
        private List<String> roles;
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

    @Data
    @AllArgsConstructor
    public static class ApiErrorResponse {

        private String message;
    }
}
