package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.NotificationEntity;
import fruit.farm.management.entity.NotificationType;
import fruit.farm.management.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService")
class NotificationServiceTest {

    @Mock
    NotificationRepository notificationRepository;

    @InjectMocks
    NotificationService service;

    @Captor
    ArgumentCaptor<NotificationEntity> entityCaptor;

    private UserDto gardener;

    @BeforeEach
    void setUp() {
        gardener = new UserDto();
        gardener.setId(42L);
        when(notificationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private NotificationDto incoming() {
        UserDto owner = new UserDto();
        owner.setId(42L);
        return NotificationDto.builder()
                .title("Title")
                .message("Body")
                .userDto(owner)
                .build();
    }

    private NotificationEntity savedEntity() {
        verify(notificationRepository).save(entityCaptor.capture());
        return entityCaptor.getValue();
    }

    @Test
    @DisplayName("addExpenseNotification stamps type EXPENSE, sets createdAt and the owner id")
    void addExpenseNotification_stampsTypeCreatedAtAndOwner() {
        service.addExpenseNotification(incoming(), gardener);

        NotificationEntity saved = savedEntity();
        assertThat(saved.getNotificationType()).isEqualTo(NotificationType.EXPENSE);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUserEntity().getId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("addProfitNotification stamps type PROFIT")
    void addProfitNotification_stampsTypeProfit() {
        service.addProfitNotification(incoming(), gardener);

        assertThat(savedEntity().getNotificationType()).isEqualTo(NotificationType.PROFIT);
    }

    @Test
    @DisplayName("addUserNotification stamps type USER")
    void addUserNotification_stampsTypeUser() {
        service.addUserNotification(incoming(), gardener);

        assertThat(savedEntity().getNotificationType()).isEqualTo(NotificationType.USER);
    }

    @Test
    @DisplayName("addSectorNotification stamps type SECTOR")
    void addSectorNotification_stampsTypeSector() {
        service.addSectorNotification(incoming(), gardener);

        assertThat(savedEntity().getNotificationType()).isEqualTo(NotificationType.SECTOR);
    }
}
