package fruit.farm.management.service;

import fruit.farm.management.dto.AuditLogDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.AuditAction;
import fruit.farm.management.entity.AuditLogEntity;
import fruit.farm.management.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService")
class AuditLogServiceTest {

    @Mock
    AuditLogRepository auditLogRepository;

    @Mock
    UserService userService;

    @InjectMocks
    AuditLogService service;

    @Captor
    ArgumentCaptor<AuditLogEntity> entryCaptor;

    private UserDto actor() {
        UserDto actor = new UserDto();
        actor.setId(1L);
        actor.setName("Anna");
        actor.setSurname("Admin");
        actor.setNickname("admin");
        return actor;
    }

    @Test
    @DisplayName("record persists an entry with the current user as actor")
    void record_persistsEntryWithActor() {
        when(userService.getLoggedUser()).thenReturn(actor());

        service.record(AuditAction.USER_BLOCKED, "USER", 5L, "Konto zablokowane");

        org.mockito.Mockito.verify(auditLogRepository).save(entryCaptor.capture());
        AuditLogEntity saved = entryCaptor.getValue();
        assertThat(saved.getPerformedById()).isEqualTo(1L);
        assertThat(saved.getPerformedByName()).isEqualTo("Anna Admin");
        assertThat(saved.getAction()).isEqualTo(AuditAction.USER_BLOCKED);
        assertThat(saved.getTargetType()).isEqualTo("USER");
        assertThat(saved.getTargetId()).isEqualTo(5L);
        assertThat(saved.getDetails()).isEqualTo("Konto zablokowane");
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("record falls back to the nickname when the actor has no full name")
    void record_fallsBackToNickname() {
        UserDto actor = new UserDto();
        actor.setId(2L);
        actor.setNickname("onlynick");
        when(userService.getLoggedUser()).thenReturn(actor);

        service.record(AuditAction.USER_ROLE_CHANGED, "USER", 9L, "x");

        org.mockito.Mockito.verify(auditLogRepository).save(entryCaptor.capture());
        assertThat(entryCaptor.getValue().getPerformedByName()).isEqualTo("onlynick");
    }

    @Test
    @DisplayName("getRecentLogs maps entities to DTOs")
    void getRecentLogs_mapsEntities() {
        AuditLogEntity entity = AuditLogEntity.builder()
                .id(3L)
                .performedById(1L)
                .performedByName("Anna Admin")
                .action(AuditAction.USER_PASSWORD_RESET)
                .targetType("USER")
                .targetId(5L)
                .details("reset")
                .createdAt(LocalDateTime.of(2026, 6, 1, 12, 0))
                .build();
        when(auditLogRepository.findRecent()).thenReturn(List.of(entity));

        List<AuditLogDto> result = service.getRecentLogs();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAction()).isEqualTo("USER_PASSWORD_RESET");
        assertThat(result.get(0).getPerformedByName()).isEqualTo("Anna Admin");
        assertThat(result.get(0).getTargetId()).isEqualTo(5L);
    }
}
