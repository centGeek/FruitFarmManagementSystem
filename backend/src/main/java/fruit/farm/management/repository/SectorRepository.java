package fruit.farm.management.repository;

import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.repository.jpa.SelectorJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@AllArgsConstructor
@Repository
public class SectorRepository {

    private SelectorJpaRepository sectorJpaRepository;
    public Optional<SectorEntity> findById(long id) {
        return sectorJpaRepository.findById(id);
    }

    public SectorEntity save(SectorEntity sectorEntity) {
        return sectorJpaRepository.save(sectorEntity);
    }

    public void deleteById(Long id) {
        sectorJpaRepository.deleteById(id);
    }

    public List<SectorEntity> findAll() {
        return sectorJpaRepository.findAll();
    }

    public long count() {
        return sectorJpaRepository.count();
    }

    public long countActiveSectors() {
        return sectorJpaRepository.countActiveSectors();
    }

    public List<SectorEntity> findAllActiveByUserId(long userId) {
        return sectorJpaRepository.findAllActiveByUserId(userId);
    }

    public List<SectorEntity> findAllArchivedByUserId(long userId) {
        return sectorJpaRepository.findAllArchivedByUserId(userId);
    }
}
