package fruit.farm.management.repository;

import fruit.farm.management.entity.AdvancePayEntity;
import fruit.farm.management.repository.jpa.AdvancePayJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@AllArgsConstructor
public class AdvancePayRepository {

    private AdvancePayJpaRepository advancePayJpaRepository;

    public void settleAdvancePayEntries(long userId) {

        advancePayJpaRepository.settleAdvancePayEntries(userId);
    }

    public AdvancePayEntity save(AdvancePayEntity advancePayEntity) {

        return advancePayJpaRepository.save(advancePayEntity);
    }
}
