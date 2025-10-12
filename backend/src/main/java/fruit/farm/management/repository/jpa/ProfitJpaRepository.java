package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.ProfitEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface ProfitJpaRepository extends JpaRepository<ProfitEntity, Long> {

    @Query("""
            select pe from profit_entity pe where pe.userEntity.id =:userId and pe.userEntity.role.roleName = "Gardener"
             """)
    List<ProfitEntity> getAllProfitsByGardener(long userId);

    @Query("SELECT pe FROM profit_entity pe WHERE pe.userEntity.id = :userId ORDER BY pe.createdAt DESC")
    Page<ProfitEntity> findByUserId(Long userId, Pageable pageable);
}
