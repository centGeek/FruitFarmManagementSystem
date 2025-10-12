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
    Page<ExpenseEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
