package fruit.farm.management.repository;

import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.repository.jpa.UserCredentialsJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Repository;

@AllArgsConstructor
@Repository
public class UserCredentialsRepository {

    private UserCredentialsJpaRepository userCredentialsJpaRepository;
    private PasswordEncoder passwordEncoder;

    public void update(UserCredentialsEntity userCredentialsEntity) {

        String encoded = passwordEncoder.encode(userCredentialsEntity.getPasswordHash());
        userCredentialsJpaRepository.update(userCredentialsEntity.getUser().getId(), encoded);
    }

    public UserCredentialsEntity save(UserCredentialsEntity userCredentialsEntity) {

        userCredentialsEntity.setPasswordHash(passwordEncoder.encode(userCredentialsEntity.getPasswordHash()));
        return userCredentialsJpaRepository.save(userCredentialsEntity);
    }
}
