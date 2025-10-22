package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.SectorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface SelectorJpaRepository extends JpaRepository<SectorEntity, Long> {
    @Query("select se from sector_entity se where se.userEntity.id =:userId")
    List<SectorEntity> findAllByUserId(long userId);
}
