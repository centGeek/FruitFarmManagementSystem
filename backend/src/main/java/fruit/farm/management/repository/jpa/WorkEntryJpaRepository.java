package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.WorkEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkEntryJpaRepository extends JpaRepository<WorkEntryEntity, Long> {
}
