package fruit.farm.management.repository;

import fruit.farm.management.entity.AuditLogEntity;
import fruit.farm.management.repository.jpa.AuditLogJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@AllArgsConstructor
public class AuditLogRepository {

    private AuditLogJpaRepository auditLogJpaRepository;

    public AuditLogEntity save(AuditLogEntity entity) {
        return auditLogJpaRepository.save(entity);
    }

    public List<AuditLogEntity> findRecent() {
        return auditLogJpaRepository.findTop200ByOrderByCreatedAtDesc();
    }
}
