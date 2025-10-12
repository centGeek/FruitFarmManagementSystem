package fruit.farm.management.repository;

import fruit.farm.management.entity.TaskDefinitionEntity;
import fruit.farm.management.repository.jpa.TaskDefinitionJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class TaskDefinitionRepository {

    private final TaskDefinitionJpaRepository taskDefinitionJpaRepository;

    public TaskDefinitionEntity saveOrUpdate(TaskDefinitionEntity entry) {

        return taskDefinitionJpaRepository.save(entry);
    }

    public Optional<TaskDefinitionEntity> findById(Long id) {
        return taskDefinitionJpaRepository.findById(id);
    }

    public List<TaskDefinitionEntity> findAll() {
        return taskDefinitionJpaRepository.findAll();
    }

    public void deleteById(Long id) {
        taskDefinitionJpaRepository.deleteById(id);
    }
}
