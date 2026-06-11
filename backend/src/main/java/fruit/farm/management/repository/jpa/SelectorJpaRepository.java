package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.SectorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface SelectorJpaRepository extends JpaRepository<SectorEntity, Long> {

    @Query("select count(se) from sector_entity se where se.isActive = true")
    long countActiveSectors();

    @Query("select se from sector_entity se where se.userEntity.id =:userId and se.isActive = true")
    List<SectorEntity> findAllActiveByUserId(long userId);

    @Query("select se from sector_entity se where se.userEntity.id =:userId and se.isActive = false")
    List<SectorEntity> findAllArchivedByUserId(long userId);
}
