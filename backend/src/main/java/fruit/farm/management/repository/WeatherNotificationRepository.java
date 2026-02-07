package fruit.farm.management.repository;

import fruit.farm.management.entity.WeatherNotificationEntity;
import fruit.farm.management.repository.jpa.WeatherNotificationJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class WeatherNotificationRepository {

    private WeatherNotificationJpaRepository weatherNotificationJpaRepository;

    public List<WeatherNotificationEntity> findByUserId(Long userId) {
        return weatherNotificationJpaRepository.findByUserId(userId);
    }

    public List<WeatherNotificationEntity> findAllActiveNotifications() {
        return weatherNotificationJpaRepository.findAllActiveNotifications();
    }
    public Optional<WeatherNotificationEntity> findById(long id) {
        return weatherNotificationJpaRepository.findById(id);
    }

    public void delete(WeatherNotificationEntity weatherNotificationEntity) {
        weatherNotificationJpaRepository.delete(weatherNotificationEntity);
    }

    public WeatherNotificationEntity save(WeatherNotificationEntity weatherNotificationEntity) {
        return weatherNotificationJpaRepository.save(weatherNotificationEntity);
    }
}
