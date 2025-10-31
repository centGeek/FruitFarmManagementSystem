package fruit.farm.management.repository;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.repository.jpa.RoleJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@AllArgsConstructor
@Repository
public class RoleRepository {

    private RoleJpaRepository roleJpaRepository;


    public RoleEntity save(RoleEntity roleEntity) {

        return roleJpaRepository.save(roleEntity);
    }

    public Optional<RoleEntity> findByRoleName(String roleName) {

        return roleJpaRepository.findByRoleName(roleName);
    }
}
