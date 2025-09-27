package fruit.farm.management.security.dto;

import fruit.farm.management.entity.UserEntity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserDTO {

    @NotBlank(message = "Nazwa jest wymagana")
    @Size(min = 2, max = 50, message = "Nazwa musi mieć między 2 a 50 znaków")
    private String name;

    @NotBlank(message = "Nazwa jest wymagana")
    @Size(min = 2, max = 50, message = "Nazwisko musi mieć między 2 a 50 znaków")
    private String surname;

    @NotBlank(message = "Email jest wymagany")
    @Email(message = "Email musi być poprawny")
    private String email;

    @NotBlank(message = "Email jest wymagany")
    @Email(message = "Email musi być poprawny")
    private String nickname;

    @NotBlank(message = "Numer telefonu jest wymagany")
    @Email(message = "Numer telefonu musi byc poprawny")
    private String phoneNumber;

    @NotBlank(message = "Hasło jest wymagane")
    @Size(min = 6, message = "Hasło musi mieć minimum 6 znaków")
    private String password;

    @NotBlank(message = "Potwierdzenie hasła jest wymagane")
    private String confirmPassword;

    private boolean isActive;

    private UserEntity gardener;

}