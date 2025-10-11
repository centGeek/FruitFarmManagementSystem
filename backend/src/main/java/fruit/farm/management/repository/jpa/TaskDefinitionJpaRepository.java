package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.TaskDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskDefinitionJpaRepository extends JpaRepository<TaskDefinitionEntity, Long> {
}
