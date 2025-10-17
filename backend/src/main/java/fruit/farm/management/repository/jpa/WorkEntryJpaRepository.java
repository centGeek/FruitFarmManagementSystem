package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.WorkEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkEntryJpaRepository extends JpaRepository<WorkEntryEntity, Long> {
    @Query("SELECT we FROM WorkEntryEntity we WHERE we.user.gardener.id = :gardenerId")
    List<WorkEntryEntity> findByUserGardenerId(@Param("gardenerId") Long gardenerId);

    @Query("""
            SELECT we FROM WorkEntryEntity we
            WHERE we.user.email =:email
            AND FUNCTION('DATE', we.endTime) =:date
            """)
    List<WorkEntryEntity> findWorkEntriesByGivenDayForEmployee(
            @Param("email") String email,
            @Param("date") LocalDate date
    );

}
