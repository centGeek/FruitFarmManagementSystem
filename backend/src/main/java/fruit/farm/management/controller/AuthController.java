package fruit.farm.management.controller;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.jpa.RoleJpaRepository;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.dto.UserDTO;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
@Slf4j
public class AuthController {

    private AuthenticationManager authenticationManager;
    private JwtService jwtService;
    private UserRepository userRepository;
    private RoleJpaRepository roleJpaRepository;
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        Optional<UserEntity> userByEmail = userRepository.findByEmail(user.getUsername());
        String token = jwtService.generateToken(
                userByEmail.get().getId(),
                user.getUsername(),
                user.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList())
        );

        Cookie cookie = new Cookie("token", token);
        cookie.setPath("/");
        cookie.setMaxAge(3600);

        response.addCookie(cookie);

        return ResponseEntity.ok(new AuthResponse(token, request.getEmail()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserDTO request, HttpServletResponse response) {
        try {
            Optional<UserEntity> existingUser = userRepository.findByEmail(request.getEmail().toLowerCase());
            if (existingUser.isPresent()) {
                return ResponseEntity.badRequest().body(new ApiErrorResponse("Użytkownik z tym adresem email już istnieje"));
            }

            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiErrorResponse("Imię jest wymagane"));
            }
            if (request.getSurname() == null || request.getSurname().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiErrorResponse("Nazwisko jest wymagane"));
            }
            if (request.getEmail() == null || !request.getEmail().matches("\\S+@\\S+\\.\\S+")) {
                return ResponseEntity.badRequest().body(new ApiErrorResponse("Podaj prawidłowy adres email"));
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body(new ApiErrorResponse("Hasło musi mieć co najmniej 6 znaków"));
            }

            RoleEntity defaultRole = roleJpaRepository.findByRoleName("Gardener")
                    .orElseThrow(() -> new RuntimeException("Domyślna rola nie została znaleziona"));

            UserEntity newUser = new UserEntity(
                    request.getName().trim(),
                    request.getSurname().trim(),
                    request.getNickname() != null ? request.getNickname().trim() : null,
                    request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null,
                    request.getEmail().toLowerCase().trim(),
                    LocalDate.now(),
                    passwordEncoder.encode(request.getPassword()),
                    defaultRole,
                    true,
                    null
            );

            UserEntity savedUser = userRepository.save(newUser);
            log.info("New user registered: {}", savedUser.getEmail());

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();
            String token = jwtService.generateToken(
                    savedUser.getId(),
                    user.getUsername(),
                    user.getAuthorities()
                            .stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList())
            );

            Cookie cookie = new Cookie("token", token);
            cookie.setPath("/");
            cookie.setMaxAge(3600);
            response.addCookie(cookie);

            return ResponseEntity.ok(new AuthResponse(token, savedUser.getEmail()));

        } catch (Exception e) {
            log.error("Registration error: ", e);
            return ResponseEntity.badRequest().body(new ApiErrorResponse("Błąd podczas rejestracji"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {

        Cookie cookie = new Cookie("token", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);

        return ResponseEntity.ok("Successfully logged out");
    }

    @Data
    public static class AuthRequest {
        private String email;
        private String password;
    }

    @Data
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String email;
    }

}
