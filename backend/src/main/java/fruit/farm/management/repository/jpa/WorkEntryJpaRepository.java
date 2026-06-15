package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.AdvancePayEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorkEntryJpaRepository extends JpaRepository<WorkEntryEntity, Long> {

    @Query("select coalesce(sum(we.daySalary), 0) from WorkEntryEntity we")
    BigDecimal sumAllSalaries();

    @Query("select coalesce(sum(we.kilogramsPicked), 0) from WorkEntryEntity we")
    long sumAllKilogramsPicked();

    @Query("SELECT we FROM WorkEntryEntity we WHERE we.user.gardener.id = :gardenerId")
    List<WorkEntryEntity> findByUserGardenerId(@Param("gardenerId") Long gardenerId);

    @Query("""
            SELECT we FROM WorkEntryEntity we
            WHERE we.user.nickname =:nickname
            AND FUNCTION('DATE', we.workDate) =:date
            """)
    List<WorkEntryEntity> findWorkEntriesByGivenDayForEmployee(
            @Param("nickname") String nickname,
            @Param("date") LocalDate date
    );

    @Query("SELECT w FROM WorkEntryEntity w WHERE " +
            "(:year IS NULL OR YEAR(w.workDate) = :year) AND " +
            "(:month IS NULL OR MONTH(w.workDate) = :month) AND " +
            "((:sectorId IS NULL AND w.sector IS NULL) OR (:sectorId IS NOT NULL AND w.sector.sectorId = :sectorId)) AND " +
            "(w.user.gardener.id = :userId)")
    List<WorkEntryEntity> findAllExpensesByGivenDate(
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("sectorId") Long sectorId,
            @Param("userId") Long userId
    );
    @Modifying
    @Transactional
    @Query("UPDATE WorkEntryEntity we SET we.isPaid = TRUE " +
            "WHERE we.user.id = :userId " +
            "AND we.isPaid = FALSE " +
            "AND we.workDate <= CURRENT_DATE()")
    int payAllUnpaidEntries(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE WorkEntryEntity we SET we.isPaid = TRUE " +
            "WHERE we.user.id = :userId " +
            "AND we.isPaid = FALSE " +
            "AND YEAR(we.workDate) = YEAR(CURRENT_DATE()) " +
            "AND MONTH(we.workDate) = MONTH(CURRENT_DATE())")
    int payAllUnpaidEntriesForCurrentMonth(@Param("userId") Long userId);


    // Hot path: the WorkSchedule page re-fires this on every week navigation. The EntityGraph
    // fetch-joins the ManyToOne graph (user, its gardener, sector) in one statement instead of a
    // lazy-load per row; the remaining collections/one-to-ones are batched via
    // hibernate.default_batch_fetch_size (application.yml). Coordinates are intentionally NOT in the
    // graph — fetch-joining a @OneToMany would multiply rows and break the ORDER BY.
    @EntityGraph(attributePaths = {"user", "user.gardener", "sector"})
    @Query("SELECT we FROM WorkEntryEntity we " +
            "WHERE we.user.gardener.id = :gardenerId " +
            "AND we.workDate >= :startDate " +
            "AND we.workDate <= :endDate " +
            "ORDER BY we.workDate ASC, we.user.surname ASC")
    List<WorkEntryEntity> findByUserGardenerIdAndWorkDateBetween(
            @Param("gardenerId") Long gardenerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    @Query("""
            SELECT we FROM WorkEntryEntity we
            WHERE we.user.id =:userId and we.isPaid = FALSE
            """)
    List<WorkEntryEntity> getUnpaidEntriesByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT ae FROM AdvancePayEntity ae
            WHERE ae.isSettled = FALSE and ae.user.id = :userId
            """)
    List<AdvancePayEntity> getUnsettledAdvancesByUserId(Long userId);

    @Query("""
            SELECT ae FROM AdvancePayEntity ae
            WHERE ae.isSettled = FALSE and ae.user.gardener.id = :userId
            """)
    List<AdvancePayEntity> getUnsettledAdvancesByGardenerId(Long userId);
}
