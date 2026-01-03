package fruit.farm.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "user_credentials_entity")
@Getter
@Setter
@ToString
public class UserCredentialsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credential_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private UserEntity user;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    public UserCredentialsEntity(UserEntity user, String passwordHash) {
        this.user = user;
        this.passwordHash = passwordHash;
    }
}
