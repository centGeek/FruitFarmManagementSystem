package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.WorkDetailsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkDetailsJpaRepository extends JpaRepository<WorkDetailsEntity, Long> {
    List<WorkDetailsEntity> findByUserEntityId(Long userId);

    @Query("Select wd from work_details wd where wd.userEntity.id =:userId order by wd.createdAt desc limit 1")
    WorkDetailsEntity findTopByUserEntityIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    @Query("Select wd from work_details wd where wd.userEntity.email =:email order by wd.createdAt desc limit 1")
    WorkDetailsEntity getLatestWorkDetailsForUserByEmail(@Param("email") String email);
}
