package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.ProfitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationJpaRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findAllByOrderByCreatedAtDesc();

    List<NotificationEntity> findByUserEntityIdOrderByCreatedAtDesc(Long userId);
}
