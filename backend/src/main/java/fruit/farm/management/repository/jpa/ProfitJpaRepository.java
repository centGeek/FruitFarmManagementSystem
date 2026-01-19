package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.ProfitEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
@Repository

public interface ProfitJpaRepository extends JpaRepository<ProfitEntity, Long> {

    @Query("""
            select pe from profit_entity pe where pe.userEntity.id =:userId and pe.userEntity.role.roleName = "Gardener"
             """)
    List<ProfitEntity> getAllProfitsByGardener(long userId);

    @Query("SELECT pe FROM profit_entity pe WHERE " +

            "(:year IS NULL OR YEAR(pe.createdAt) = :year) AND " +
            "(:month IS NULL OR MONTH(pe.createdAt) = :month) AND " +
            "pe.userEntity.id = :userId ORDER BY pe.createdAt DESC")
    Page<ProfitEntity> findByUserId(Long userId, @Param("year") Integer year, @Param("month") Integer month, Pageable pageable);
}
