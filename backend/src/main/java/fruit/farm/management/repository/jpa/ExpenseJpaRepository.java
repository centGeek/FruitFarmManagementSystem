package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.ExpenseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseJpaRepository extends JpaRepository<ExpenseEntity, Long> {

    @Query("""
            select ee from expense_entity ee where ee.userEntity.id =:userId and ee.userEntity.role.roleName = "Gardener"
             """)
    List<ExpenseEntity> getAllExpensesByGardener(@Param("userId") long userId);


    @Query("""
            select ee from expense_entity ee where ee.expenseId =:expenseId
             """)
    ExpenseEntity getExpenseById(@Param("expenseId") long expenseId);


    @Query("SELECT e FROM expense_entity e WHERE e.userEntity.id = :userId ORDER BY e.createdAt DESC")
    List<ExpenseEntity> getAllExpensesByGardener(@Param("userId") Long userId);

    @Query("SELECT e FROM expense_entity e WHERE e.userEntity.id = :gardenerId " +
            "AND (:type IS NULL OR e.productType = :type) " +
            "AND (:paid IS NULL OR e.isPaid = :paid) " +
            "AND (:sectorId IS NULL OR e.sectorEntity.sectorId = :sectorId) " +
            "AND (:year IS NULL OR YEAR(e.createdAt) = :year) " +
            "AND (:search IS NULL OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ExpenseEntity> findByFilters(
            @Param("gardenerId") Long gardenerId,
            @Param("type") String type,
            @Param("paid") Boolean paid,
            @Param("sectorId") Long sectorId,
            @Param("year") Integer year,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT e FROM expense_entity e WHERE e.userEntity.id = :gardenerId " +
            "AND (:type IS NULL OR e.productType = :type) " +
            "AND (:paid IS NULL OR e.isPaid = :paid) " +
            "AND (:sectorId IS NULL OR e.sectorEntity.sectorId = :sectorId) " +
            "AND (:year IS NULL OR YEAR(e.createdAt) = :year) " +
            "AND (:search IS NULL OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<ExpenseEntity> findByFiltersWithoutPaging(
            @Param("gardenerId") Long gardenerId,
            @Param("type") String type,
            @Param("paid") Boolean paid,
            @Param("sectorId") Long sectorId,
            @Param("year") Integer year,
            @Param("search") String search
    );
}
