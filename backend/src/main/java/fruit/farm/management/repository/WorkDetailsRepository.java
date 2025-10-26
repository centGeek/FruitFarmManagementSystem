package fruit.farm.management.repository;

import fruit.farm.management.entity.WorkDetailsEntity;
import fruit.farm.management.repository.jpa.WorkDetailsJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class WorkDetailsRepository {

    private WorkDetailsJpaRepository workDetailsJpaRepository;

    public WorkDetailsEntity save(WorkDetailsEntity workDetailsEntity) {

        return workDetailsJpaRepository.save(workDetailsEntity);
    }

    public List<WorkDetailsEntity> findAll() {

        return workDetailsJpaRepository.findAll();
    }

    public List<WorkDetailsEntity> findByUserEntityId(Long userId) {

        return workDetailsJpaRepository.findByUserEntityId(userId);
    }

    public Optional<WorkDetailsEntity> findById(Long id) {

        return workDetailsJpaRepository.findById(id);
    }

    public void deleteById(Long id) {

        workDetailsJpaRepository.deleteById(id);
    }

    public boolean existsById(Long id) {

        return workDetailsJpaRepository.existsById(id);
    }

    public WorkDetailsEntity findTopByUserEntityIdOrderByCreatedAtDesc(Long userId) {

        return workDetailsJpaRepository.findTopByUserEntityIdOrderByCreatedAtDesc(userId);
    }

    public WorkDetailsEntity getLatestWorkDetailsForUserByEmail(String email) {
        return workDetailsJpaRepository.getLatestWorkDetailsForUserByEmail(email);
    }

    public WorkDetailsEntity getLatestWorkDetailsForGardener(long id) {
        return workDetailsJpaRepository.getLatestWorkDetailsForGardener(id);
    }
}
