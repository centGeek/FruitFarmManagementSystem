package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {

    @Query("""
            select usr from user_profile usr where usr.email =:email
             """)
    Optional<UserEntity> findByEmail(@Param("email") String email);

    @Query("""
            select usr from user_profile usr where usr.role.roleName =:roleName
             """)
    List<UserEntity> getAllUsersByRoleName(@Param("roleName") String roleName);


    @Query("""
            select usr from user_profile usr where usr.isActive = false
            and usr.role.roleName = "Employee" and usr.gardener.id =:gardenerId
             """)
    List<UserEntity> getAllArchivedEmployees(@Param("gardenerId") long gardenerId);

    @Query("""
            select usr from user_profile usr where usr.isActive = true
            and usr.role.roleName = "Employee" and usr.gardener.id =:gardenerId
             """)
    List<UserEntity> getAllActiveEmployees(@Param("gardenerId") long gardenerId);

    @Query("""
            select usr from user_profile usr
             """)
    List<UserEntity> getAll();

    @Query("""
            select usr from user_profile usr where usr.role.roleName = "Employee"
            and usr.gardener.id =:gardenerId
             """)
    List<UserEntity> getAllEmployees(@Param("gardenerId") long gardenerId);
}
