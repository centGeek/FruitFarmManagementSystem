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

    // :search is a pre-lowercased, %-wrapped pattern (or null) built in the service.
    // It must be compared directly against a string expression (LIKE :search) rather than
    // wrapped in CONCAT(...): a bare null inside CONCAT gives PostgreSQL no type to infer,
    // so it defaults to bytea and the query blows up with "function lower(bytea) does not exist".
    @Query("""
            SELECT t FROM TicketEntity t WHERE
            (:status IS NULL OR t.status = :status) AND
            (:search IS NULL OR
             LOWER(t.description) LIKE :search OR
             LOWER(t.userEntity.name) LIKE :search OR
             LOWER(t.userEntity.surname) LIKE :search OR
             LOWER(t.userEntity.nickname) LIKE :search OR
             LOWER(t.userEntity.email) LIKE :search)
            """)
    Page<TicketEntity> findAllFiltered(@Param("status") TicketStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);

    long countByStatus(TicketStatus status);
}
