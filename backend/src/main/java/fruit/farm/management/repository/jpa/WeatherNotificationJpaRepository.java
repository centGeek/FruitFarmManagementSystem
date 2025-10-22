package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.NotificationType;
import fruit.farm.management.entity.WeatherNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeatherNotificationJpaRepository extends JpaRepository<WeatherNotificationEntity, Long> {

    List<WeatherNotificationEntity> findByUserId(Long userId);

    List<WeatherNotificationEntity> findByUserIdAndEnabledTrue(Long userId);

    List<WeatherNotificationEntity> findByWeatherNotificationType(NotificationType type);

    @Query("SELECT wn FROM WeatherNotificationEntity wn WHERE wn.enabled = true")
    List<WeatherNotificationEntity> findAllActiveNotifications();
}