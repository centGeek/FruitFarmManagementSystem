package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.CoordinateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoordinateJpaRepository extends JpaRepository<CoordinateEntity, Long> {
}
