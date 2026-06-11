package fruit.farm.management.service;

import fruit.farm.management.dto.AuditLogDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.AuditAction;
import fruit.farm.management.entity.AuditLogEntity;
import fruit.farm.management.mapper.AuditLogMapper;
import fruit.farm.management.repository.AuditLogRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class AuditLogService {

    private AuditLogRepository auditLogRepository;
    private UserService userService;

    public void record(AuditAction action, String targetType, Long targetId, String details) {

        UserDto actor = userService.getLoggedUser();
        AuditLogEntity entry = AuditLogEntity.builder()
                .performedById(actor.getId())
                .performedByName(buildActorName(actor))
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(entry);
        log.info("Audit: {} by {} on {}#{}", action, actor.getId(), targetType, targetId);
    }

    public List<AuditLogDto> getRecentLogs() {

        return auditLogRepository.findRecent().stream()
                .map(AuditLogMapper::mapFromEntity)
                .toList();
    }

    private String buildActorName(UserDto actor) {
        String full = ((actor.getName() == null ? "" : actor.getName()) + " "
                + (actor.getSurname() == null ? "" : actor.getSurname())).trim();
        return full.isEmpty() ? actor.getNickname() : full;
    }
}
