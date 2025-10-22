package fruit.farm.management.entity;

import fruit.farm.management.dto.CoordinateDTO;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "user_profile")
@Getter
@Setter
@ToString
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "surname")
    private String surname;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "creation_date")
    private LocalDate creationDate;

    @Column(name = "password")
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private RoleEntity role;

    @Column(name = "is_active")
    private boolean isActive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gardener_id")
    private UserEntity gardener;

    @OneToOne
    @JoinColumn(name = "coordinate_id")
    private CoordinateEntity coordinateEntity;

    @Column(name = "locality_name")
    private String localityName;

    public UserEntity(String name, String surname, String nickname, String phoneNumber, String email, LocalDate creationDate,
                      String password, RoleEntity role, boolean isActive, UserEntity gardener,
                      CoordinateEntity coordinateEntity, String localityName) {
        this.name = name;
        this.surname = surname;
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.creationDate = creationDate;
        this.password = password;
        this.role = role;
        this.isActive = isActive;
        this.gardener = gardener;
        this.coordinateEntity = coordinateEntity;
        this.localityName = localityName;
    }
}