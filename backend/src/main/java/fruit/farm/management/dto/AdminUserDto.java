package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserDto {

    private Long id;
    private String name;
    private String surname;
    private String nickname;
    private String email;
    private String phoneNumber;
    private String roleName;
    private boolean isActive;
    private LocalDate creationDate;
    private String localityName;
    private Long gardenerId;
    private String gardenerName;
    private long employeeCount;
}
