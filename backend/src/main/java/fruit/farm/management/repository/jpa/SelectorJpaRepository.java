package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.SectorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SelectorJpaRepository extends JpaRepository<SectorEntity, Long> {
}
