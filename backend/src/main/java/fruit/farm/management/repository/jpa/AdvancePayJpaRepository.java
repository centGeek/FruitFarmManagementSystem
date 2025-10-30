package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.AdvancePayEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface AdvancePayJpaRepository extends JpaRepository<AdvancePayEntity, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE AdvancePayEntity ap " +
            "set ap.isSettled = true where ap.user.id =:userId")
    void settleAdvancePayEntries(@Param("userId") long userId);
}
