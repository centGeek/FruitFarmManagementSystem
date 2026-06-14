package fruit.farm.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserCredentialsDto {

    @NotBlank(message = "{password.required}")
    @Size(min = 6, message = "{password.size}")
    private String password;

    @NotBlank(message = "{password.confirm.required}")
    private String confirmPassword;
}
