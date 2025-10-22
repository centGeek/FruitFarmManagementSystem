package fruit.farm.management.repository;

import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.repository.jpa.CoordinateJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@AllArgsConstructor
public class CoordinateRepository {

    private CoordinateJpaRepository coordinateJpaRepository;


    public CoordinateEntity addCoordinate(CoordinateEntity coordinateEntity) {

        return coordinateJpaRepository.save(coordinateEntity);
    }
}
