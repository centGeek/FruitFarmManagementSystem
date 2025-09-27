package fruit.farm.management.controller;

import fruit.farm.management.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final JwtService jwtService;

    public DebugController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @GetMapping("/token-info")
    public ResponseEntity<?> getTokenInfo(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null) {
            return ResponseEntity.ok("No token");
        }

        Map<String, Object> info = new HashMap<>();
        info.put("email", jwtService.getEmailFromToken(token));
        info.put("roles", jwtService.getRolesFromToken(token));
        info.put("id", jwtService.getIdFromToken(token));

        return ResponseEntity.ok(info);
    }

    @GetMapping("/current-auth")
    public ResponseEntity<?> getCurrentAuth(Authentication auth) {
        if (auth == null) return ResponseEntity.ok("No auth");

        Map<String, Object> info = new HashMap<>();
        info.put("principal", auth.getPrincipal());
        info.put("authorities", auth.getAuthorities());
        info.put("isAuthenticated", auth.isAuthenticated());

        return ResponseEntity.ok(info);
    }
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}