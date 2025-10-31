package fruit.farm.management.repository;

import fruit.farm.management.entity.WorkDetailsEntity;
import fruit.farm.management.exception.WorkDetailsIsNotFoundException;
import fruit.farm.management.repository.jpa.WorkDetailsJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class WorkDetailsRepository {

    private WorkDetailsJpaRepository workDetailsJpaRepository;

    public WorkDetailsEntity save(WorkDetailsEntity workDetailsEntity) {

        return workDetailsJpaRepository.save(workDetailsEntity);
    }

    public List<WorkDetailsEntity> findAll() {

        return workDetailsJpaRepository.findAll();
    }

    public List<WorkDetailsEntity> findByUserEntityId(Long userId) {

        return workDetailsJpaRepository.findByUserEntityId(userId);
    }

    public Optional<WorkDetailsEntity> findById(Long id) {

        return workDetailsJpaRepository.findById(id);
    }

    public void deleteById(Long id) {

        workDetailsJpaRepository.deleteById(id);
    }

    public boolean existsById(Long id) {

        return workDetailsJpaRepository.existsById(id);
    }


    public Optional<WorkDetailsEntity> getLatestWorkDetailsForUserByNickname(String nickname) {
        Optional<WorkDetailsEntity> workDetailsOptional =
                workDetailsJpaRepository.getLatestWorkDetailsForUserByNickname(nickname);

        return workDetailsOptional.or(() -> {
            throw new WorkDetailsIsNotFoundException(
                    "Nie stworzono warunków pracowniczych. Przejdź do zakładki pracownicy, " +
                            "następnie do detali pracy \uD83D\uDCBC i dodaj zasady rozliczenia"
            );
        });
    }

    public Optional<WorkDetailsEntity> getLatestWorkDetailsForUserByGardenerId(long id) {


        return workDetailsJpaRepository.getLatestWorkDetailsForUserById(id);
    }

    public Optional<WorkDetailsEntity> getLatestWorkDetailsByGardener(long id) {

        return workDetailsJpaRepository.getLatestWorkDetailsByGardener(id);
    }
}
