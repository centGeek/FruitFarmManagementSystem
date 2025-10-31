package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.WorkDetailsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkDetailsJpaRepository extends JpaRepository<WorkDetailsEntity, Long> {
    List<WorkDetailsEntity> findByUserEntityId(Long userId);

    @Query("Select wd from work_details wd where wd.userEntity.nickname =:nickname order by wd.createdAt desc limit 1")
    Optional<WorkDetailsEntity> getLatestWorkDetailsForUserByNickname(@Param("nickname") String nickname);

    @Query("Select wd from work_details wd where wd.userEntity.id =:id order by wd.createdAt desc limit 1")
    Optional<WorkDetailsEntity> getLatestWorkDetailsForUserById(@Param("id") long id);

    @Query("Select wd from work_details wd where wd.userEntity.gardener.id =:id order by wd.createdAt desc limit 1")
    Optional<WorkDetailsEntity> getLatestWorkDetailsByGardener(long id);
}
