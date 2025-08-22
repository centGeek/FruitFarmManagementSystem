package fruit.farm.management.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthDTO {

    @Getter
    @Setter
    public static class RegisterRequest {
        @NotBlank(message = "Nazwa jest wymagana")
        @Size(min = 2, max = 50, message = "Nazwa musi mieć między 2 a 50 znaków")
        private String name;

        @NotBlank(message = "Email jest wymagany")
        @Email(message = "Email musi być poprawny")
        private String email;

        @NotBlank(message = "Hasło jest wymagane")
        @Size(min = 6, message = "Hasło musi mieć minimum 6 znaków")
        private String password;

        @NotBlank(message = "Potwierdzenie hasła jest wymagane")
        private String confirmPassword;
    }

    @Setter
    @Getter
    public static class LoginRequest {
        // Getters and setters
        @NotBlank(message = "Email jest wymagany")
        @Email(message = "Email musi być poprawny")
        private String email;

        @NotBlank(message = "Hasło jest wymagane")
        private String password;

    }

    @Setter
    @Getter
    public static class GoogleTokenRequest {
        // Getters and setters
        @NotBlank(message = "Google token jest wymagany")
        private String idToken;

    }

    @Setter
    @Getter
    public static class AuthResponse {
        private String token;
        private String type = "Bearer";
        private UserInfo user;

        public AuthResponse(String token, UserInfo user) {
            this.token = token;
            this.user = user;
        }

    }

    @Setter
    @Getter
    public static class UserInfo {
        // Getters and setters
        private Long id;
        private String name;
        private String email;
        private String picture;
        private String provider;

        public UserInfo(Long id, String name, String email, String picture, String provider) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.picture = picture;
            this.provider = provider;
        }

    }
}