package fruit.farm.management.repository;

import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.repository.jpa.WorkEntryJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class WorkEntryRepository {

    private final WorkEntryJpaRepository workEntryJpaRepository;

    public WorkEntryEntity saveOrUpdate(WorkEntryEntity entry) {

        return workEntryJpaRepository.save(entry);
    }

    public Optional<WorkEntryEntity> findById(Long id) {
        return workEntryJpaRepository.findById(id);
    }

    public List<WorkEntryEntity> findAll() {
        return workEntryJpaRepository.findAll();
    }

    public void deleteById(Long id) {
        workEntryJpaRepository.deleteById(id);
    }
}