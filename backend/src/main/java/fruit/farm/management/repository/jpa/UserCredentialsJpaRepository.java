package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserCredentialsJpaRepository extends JpaRepository<UserCredentialsEntity, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE user_credentials_entity uc SET uc.passwordHash = :passwordHash WHERE uc.user.id = :userId")
    void update(@Param("userId") long userId, @Param("passwordHash") String passwordHash
    );
}
