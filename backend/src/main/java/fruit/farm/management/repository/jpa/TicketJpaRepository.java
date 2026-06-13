package fruit.farm.management.repository.jpa;

import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketJpaRepository extends JpaRepository<TicketEntity, Long> {

    List<TicketEntity> findByUserEntityIdOrderByCreatedAtDesc(Long userId);

    List<TicketEntity> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    List<TicketEntity> findAllByOrderByCreatedAtDesc();

    @Query("""
            SELECT t FROM TicketEntity t WHERE
            (:status IS NULL OR t.status = :status) AND
            (:search IS NULL OR
             LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(t.userEntity.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(t.userEntity.surname) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(t.userEntity.nickname) LIKE LOWER(CONCAT('%', :search, '%')) OR
             LOWER(t.userEntity.email) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<TicketEntity> findAllFiltered(@Param("status") TicketStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);

    long countByStatus(TicketStatus status);
}
