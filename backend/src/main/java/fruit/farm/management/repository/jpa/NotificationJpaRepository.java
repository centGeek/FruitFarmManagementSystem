package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.ProfitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationJpaRepository extends JpaRepository<NotificationEntity, Long> {

    @Query("Select ne from NotificationEntity ne where ne.userEntity.id =:userId order by ne.createdAt desc")
    List<NotificationEntity> findAllByOrderByCreatedAtDesc(@Param("userId") long userId);

    List<NotificationEntity> findByUserEntityIdOrderByCreatedAtDesc(Long userId);
}
