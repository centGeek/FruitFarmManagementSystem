package fruit.farm.management.repository;

import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.repository.jpa.TicketJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class TicketRepository {

    private TicketJpaRepository ticketJpaRepository;

    public TicketEntity save(TicketEntity ticketEntity) {

        return ticketJpaRepository.save(ticketEntity);
    }

    public Optional<TicketEntity> findById(Long ticketId) {

        return ticketJpaRepository.findById(ticketId);
    }

    public List<TicketEntity> findAll() {

        return ticketJpaRepository.findAll();
    }

    public List<TicketEntity> findByUserIdOrderByCreatedAtDesc(Long userId) {

        return ticketJpaRepository.findByUserEntityIdOrderByCreatedAtDesc(userId);
    }

    public List<TicketEntity> findByStatusOrderByCreatedAtDesc(TicketStatus status) {

        return ticketJpaRepository.findByStatusOrderByCreatedAtDesc(status);
    }
}
