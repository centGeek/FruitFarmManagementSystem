package fruit.farm.management.repository;

import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.repository.jpa.NotificationJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@AllArgsConstructor
public class NotificationRepository {

    private NotificationJpaRepository notificationJpaRepository;

    public NotificationEntity save(NotificationEntity notificationEntity) {

        return notificationJpaRepository.save(notificationEntity);
    }

    public List<NotificationEntity> findAllByUserByOrderCreatedAtDesc(long userId) {

        return notificationJpaRepository.findAllByOrderByCreatedAtDesc(userId);
    }

    public List<NotificationEntity> findByUserEntityIdOrderByCreatedAtDesc(Long userId) {

        return notificationJpaRepository.findByUserEntityIdOrderByCreatedAtDesc(userId);
    }
}
