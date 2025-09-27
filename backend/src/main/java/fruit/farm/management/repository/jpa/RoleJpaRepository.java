package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleJpaRepository extends JpaRepository<RoleEntity, Long> {

    @Query("""
            select r from role r where r.roleName =:roleName
             """)
    Optional<RoleEntity> findByRoleName(@Param("roleName") String roleName);
}
