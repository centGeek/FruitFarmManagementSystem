package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketJpaRepository extends JpaRepository<TicketEntity, Long> {

    List<TicketEntity> findByUserEntityIdOrderByCreatedAtDesc(Long userId);

    List<TicketEntity> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    List<TicketEntity> findAllByOrderByCreatedAtDesc();
}
