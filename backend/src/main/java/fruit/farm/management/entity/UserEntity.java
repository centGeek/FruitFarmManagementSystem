package fruit.farm.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "user_profile")
@Getter
@Setter
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

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserCredentialsEntity credentials;

    public UserEntity(String name, String surname, String nickname, String phoneNumber, String email, LocalDate creationDate,
                      RoleEntity role, boolean isActive, UserEntity gardener,
                      CoordinateEntity coordinateEntity, String localityName, UserCredentialsEntity credentials) {
        this.name = name;
        this.surname = surname;
        this.nickname = nickname;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.creationDate = creationDate;
        this.role = role;
        this.isActive = isActive;
        this.gardener = gardener;
        this.coordinateEntity = coordinateEntity;
        this.localityName = localityName;
        this.credentials = credentials;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("UserEntity{");
        sb.append("name='").append(name).append('\'');
        sb.append(", surname='").append(surname).append('\'');
        sb.append(", nickname='").append(nickname).append('\'');
        sb.append(", phoneNumber='").append(phoneNumber).append('\'');
        sb.append(", email='").append(email).append('\'');
        sb.append(", creationDate=").append(creationDate);
        sb.append(", role=").append(role);
        sb.append(", isActive=").append(isActive);
        sb.append(", gardener=").append(gardener);
        sb.append(", coordinateEntity=").append(coordinateEntity);
        sb.append(", localityName='").append(localityName).append('\'');
        sb.append('}');
        return sb.toString();
    }
}
