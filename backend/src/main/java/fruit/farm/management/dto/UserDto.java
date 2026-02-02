package fruit.farm.management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {

    private long id;

    @NotBlank(message = "Nazwa jest wymagana")
    @Size(min = 2, max = 50, message = "Nazwa musi mieć między 2 a 50 znaków")
    private String name;

    @NotBlank(message = "Nazwa jest wymagana")
    @Size(min = 2, max = 50, message = "Nazwisko musi mieć między 2 a 50 znaków")
    private String surname;

    @Email(message = "Email musi być poprawny")
    private String email;

    private LocalDate creationDate;

    @NotBlank(message = "Nickname jest wymagany")
    private String nickname;

    @NotBlank(message = "Numer telefonu jest wymagany")
    private String phoneNumber;

    private String password;

    private String confirmPassword;

    private boolean isActive;

    private CoordinateDto coordinateDTO;

    private String localityName;

    private UserDto gardener;

    public UserDto(long id, String name, String surname, String email, LocalDate creationDate,
                   String nickname, String phoneNumber, boolean isActive,
                   CoordinateDto coordinateDTO, String localityName) {
        this.id = id;
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.creationDate = creationDate;
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.isActive = isActive;
        this.coordinateDTO = coordinateDTO;
        this.localityName = localityName;
    }
}