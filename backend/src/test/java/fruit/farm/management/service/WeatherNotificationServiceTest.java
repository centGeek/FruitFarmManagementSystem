package fruit.farm.management.service;

import fruit.farm.management.dto.WeatherNotificationDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WeatherNotificationEntity;
import fruit.farm.management.entity.WeatherNotificationType;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WeatherNotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("WeatherNotificationService")
class WeatherNotificationServiceTest {

    private static final String NICKNAME = "gardener1";

    @Mock
    WeatherNotificationRepository notificationRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    WeatherNotificationService service;

    @Captor
    ArgumentCaptor<WeatherNotificationEntity> entityCaptor;

    private UserEntity owner() {
        UserEntity user = new UserEntity();
        user.setId(7L);
        user.setNickname(NICKNAME);
        return user;
    }

    private WeatherNotificationEntity notificationEntity(Long id, UserEntity user, boolean enabled,
                                                         WeatherNotificationType type) {
        WeatherNotificationEntity entity = new WeatherNotificationEntity();
        entity.setId(id);
        entity.setUser(user);
        entity.setWeatherNotificationType(type);
        entity.setThreshold(2.0);
        entity.setDaysAhead(3);
        entity.setEnabled(enabled);
        entity.setCreatedAt(LocalDateTime.of(2026, 6, 1, 8, 0));
        return entity;
    }

    private WeatherNotificationDto incomingDto() {
        WeatherNotificationDto dto = new WeatherNotificationDto();
        dto.setWeatherNotificationType(WeatherNotificationType.FROST_WARNING);
        dto.setThreshold(-2.5);
        dto.setDaysAhead(3);
        dto.setEnabled(false);
        return dto;
    }

    // ---------- getAllNotificationsForUser ----------

    @Test
    @DisplayName("getAllNotificationsForUser maps every notification returned for the user")
    void getAllNotificationsForUser_whenUserExists_mapsAll() {
        UserEntity user = owner();
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findByUserId(7L)).thenReturn(List.of(
                notificationEntity(1L, user, true, WeatherNotificationType.FROST_WARNING),
                notificationEntity(2L, user, false, WeatherNotificationType.TEMP_HIGH)));

        List<WeatherNotificationDto> result = service.getAllNotificationsForUser(NICKNAME);

        assertThat(result).hasSize(2)
                .extracting(WeatherNotificationDto::getWeatherNotificationType)
                .containsExactly(WeatherNotificationType.FROST_WARNING, WeatherNotificationType.TEMP_HIGH);
    }

    @Test
    @DisplayName("getAllNotificationsForUser returns an empty list when the user has no notifications")
    void getAllNotificationsForUser_whenNone_returnsEmptyList() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.findByUserId(7L)).thenReturn(List.of());

        List<WeatherNotificationDto> result = service.getAllNotificationsForUser(NICKNAME);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getAllNotificationsForUser throws when the user does not exist")
    void getAllNotificationsForUser_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAllNotificationsForUser(NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).findByUserId(any());
    }

    // ---------- getNotificationById ----------

    @Test
    @DisplayName("getNotificationById returns the mapped notification when it belongs to the user")
    void getNotificationById_whenOwnedByUser_returnsDto() {
        UserEntity user = owner();
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(5L))
                .thenReturn(Optional.of(notificationEntity(5L, user, true, WeatherNotificationType.RAIN_FORECAST)));

        Optional<WeatherNotificationDto> result = service.getNotificationById(5L, NICKNAME);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(5L);
        assertThat(result.get().getWeatherNotificationType()).isEqualTo(WeatherNotificationType.RAIN_FORECAST);
    }

    @Test
    @DisplayName("getNotificationById returns empty when the notification belongs to another user")
    void getNotificationById_whenOwnedByOtherUser_returnsEmpty() {
        UserEntity requester = owner();
        UserEntity otherOwner = new UserEntity();
        otherOwner.setId(99L);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(requester));
        when(notificationRepository.findById(5L))
                .thenReturn(Optional.of(notificationEntity(5L, otherOwner, true, WeatherNotificationType.TEMP_LOW)));

        Optional<WeatherNotificationDto> result = service.getNotificationById(5L, NICKNAME);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getNotificationById returns empty when the notification does not exist")
    void getNotificationById_whenMissing_returnsEmpty() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.findById(5L)).thenReturn(Optional.empty());

        Optional<WeatherNotificationDto> result = service.getNotificationById(5L, NICKNAME);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getNotificationById throws when the user does not exist")
    void getNotificationById_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getNotificationById(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).findById(anyLong());
    }

    // ---------- createNotification ----------

    @Test
    @DisplayName("createNotification stores an enabled notification owned by the user with a creation timestamp")
    void createNotification_whenValid_savesEnabledOwnedNotification() {
        UserEntity user = owner();
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeatherNotificationDto result = service.createNotification(incomingDto(), NICKNAME);

        verify(notificationRepository).save(entityCaptor.capture());
        WeatherNotificationEntity saved = entityCaptor.getValue();
        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getEnabled()).isTrue();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getWeatherNotificationType()).isEqualTo(WeatherNotificationType.FROST_WARNING);
        assertThat(saved.getThreshold()).isEqualTo(-2.5);
        assertThat(saved.getDaysAhead()).isEqualTo(3);
        // returned DTO always reflects an enabled notification regardless of the incoming flag
        assertThat(result.getEnabled()).isTrue();
        assertThat(result.getDescription()).contains("przymrozku");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 8, -1})
    @DisplayName("createNotification rejects a daysAhead value outside the 1..7 range")
    void createNotification_whenDaysAheadOutOfRange_throws(int daysAhead) {
        WeatherNotificationDto dto = incomingDto();
        dto.setDaysAhead(daysAhead);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));

        assertThatThrownBy(() -> service.createNotification(dto, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Days ahead must be between 1 and 7");
        verify(notificationRepository, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 7})
    @DisplayName("createNotification accepts the boundary daysAhead values 1 and 7")
    void createNotification_whenDaysAheadAtBoundary_saves(int daysAhead) {
        WeatherNotificationDto dto = incomingDto();
        dto.setDaysAhead(daysAhead);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WeatherNotificationDto result = service.createNotification(dto, NICKNAME);

        assertThat(result.getDaysAhead()).isEqualTo(daysAhead);
        verify(notificationRepository).save(any());
    }

    @Test
    @DisplayName("createNotification throws when the user does not exist")
    void createNotification_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createNotification(incomingDto(), NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).save(any());
    }

    // ---------- updateNotification ----------

    @Test
    @DisplayName("updateNotification overwrites the editable fields and persists the entity")
    void updateNotification_whenValidAndOwned_updatesFields() {
        UserEntity user = owner();
        WeatherNotificationEntity existing =
                notificationEntity(5L, user, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(existing)).thenReturn(existing);

        WeatherNotificationDto dto = new WeatherNotificationDto();
        dto.setWeatherNotificationType(WeatherNotificationType.STRONG_WIND);
        dto.setThreshold(60.0);
        dto.setDaysAhead(5);
        dto.setEnabled(false);

        WeatherNotificationDto result = service.updateNotification(5L, dto, NICKNAME);

        assertThat(existing.getWeatherNotificationType()).isEqualTo(WeatherNotificationType.STRONG_WIND);
        assertThat(existing.getThreshold()).isEqualTo(60.0);
        assertThat(existing.getDaysAhead()).isEqualTo(5);
        assertThat(existing.getEnabled()).isFalse();
        assertThat(result.getWeatherNotificationType()).isEqualTo(WeatherNotificationType.STRONG_WIND);
        assertThat(result.getEnabled()).isFalse();
    }

    @Test
    @DisplayName("updateNotification throws when the notification belongs to another user")
    void updateNotification_whenOwnedByOtherUser_throwsUnauthorized() {
        UserEntity requester = owner();
        UserEntity otherOwner = new UserEntity();
        otherOwner.setId(99L);
        WeatherNotificationEntity existing =
                notificationEntity(5L, otherOwner, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(requester));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.updateNotification(5L, incomingDto(), NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized access to notification");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateNotification rejects a daysAhead value outside the 1..7 range")
    void updateNotification_whenDaysAheadOutOfRange_throws() {
        UserEntity user = owner();
        WeatherNotificationEntity existing =
                notificationEntity(5L, user, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));

        WeatherNotificationDto dto = incomingDto();
        dto.setDaysAhead(8);

        assertThatThrownBy(() -> service.updateNotification(5L, dto, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Days ahead must be between 1 and 7");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateNotification throws when the notification does not exist")
    void updateNotification_whenNotificationMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateNotification(5L, incomingDto(), NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Notification not found with ID: 5");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateNotification throws when the user does not exist")
    void updateNotification_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateNotification(5L, incomingDto(), NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).findById(anyLong());
    }

    // ---------- toggleNotificationStatus ----------

    @Test
    @DisplayName("toggleNotificationStatus flips an enabled notification to disabled")
    void toggleNotificationStatus_whenEnabled_flipsToDisabled() {
        UserEntity user = owner();
        WeatherNotificationEntity existing =
                notificationEntity(5L, user, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(existing)).thenReturn(existing);

        WeatherNotificationDto result = service.toggleNotificationStatus(5L, NICKNAME);

        assertThat(existing.getEnabled()).isFalse();
        assertThat(result.getEnabled()).isFalse();
    }

    @Test
    @DisplayName("toggleNotificationStatus flips a disabled notification to enabled")
    void toggleNotificationStatus_whenDisabled_flipsToEnabled() {
        UserEntity user = owner();
        WeatherNotificationEntity existing =
                notificationEntity(5L, user, false, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(existing)).thenReturn(existing);

        WeatherNotificationDto result = service.toggleNotificationStatus(5L, NICKNAME);

        assertThat(existing.getEnabled()).isTrue();
        assertThat(result.getEnabled()).isTrue();
    }

    @Test
    @DisplayName("toggleNotificationStatus throws when the notification belongs to another user")
    void toggleNotificationStatus_whenOwnedByOtherUser_throwsUnauthorized() {
        UserEntity requester = owner();
        UserEntity otherOwner = new UserEntity();
        otherOwner.setId(99L);
        WeatherNotificationEntity existing =
                notificationEntity(5L, otherOwner, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(requester));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.toggleNotificationStatus(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized access to notification");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("toggleNotificationStatus throws when the notification does not exist")
    void toggleNotificationStatus_whenNotificationMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggleNotificationStatus(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Notification not found with ID: 5");
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("toggleNotificationStatus throws when the user does not exist")
    void toggleNotificationStatus_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggleNotificationStatus(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).findById(anyLong());
    }

    // ---------- deleteNotification ----------

    @Test
    @DisplayName("deleteNotification removes a notification owned by the user")
    void deleteNotification_whenOwned_deletes() {
        UserEntity user = owner();
        WeatherNotificationEntity existing =
                notificationEntity(5L, user, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));

        service.deleteNotification(5L, NICKNAME);

        verify(notificationRepository).delete(existing);
    }

    @Test
    @DisplayName("deleteNotification throws when the notification belongs to another user")
    void deleteNotification_whenOwnedByOtherUser_throwsUnauthorized() {
        UserEntity requester = owner();
        UserEntity otherOwner = new UserEntity();
        otherOwner.setId(99L);
        WeatherNotificationEntity existing =
                notificationEntity(5L, otherOwner, true, WeatherNotificationType.FROST_WARNING);
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(requester));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.deleteNotification(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized access to notification");
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteNotification throws when the notification does not exist")
    void deleteNotification_whenNotificationMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteNotification(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Notification not found with ID: 5");
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteNotification throws when the user does not exist")
    void deleteNotification_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteNotification(5L, NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).findById(anyLong());
    }

    // ---------- getAllActiveNotifications ----------

    @Test
    @DisplayName("getAllActiveNotifications maps every active notification from the repository")
    void getAllActiveNotifications_mapsAll() {
        UserEntity user = owner();
        when(notificationRepository.findAllActiveNotifications()).thenReturn(List.of(
                notificationEntity(1L, user, true, WeatherNotificationType.FROST_WARNING),
                notificationEntity(2L, user, true, WeatherNotificationType.STRONG_WIND)));

        List<WeatherNotificationDto> result = service.getAllActiveNotifications();

        assertThat(result).hasSize(2)
                .extracting(WeatherNotificationDto::getWeatherNotificationType)
                .containsExactly(WeatherNotificationType.FROST_WARNING, WeatherNotificationType.STRONG_WIND);
    }

    @Test
    @DisplayName("getAllActiveNotifications returns an empty list when there are no active notifications")
    void getAllActiveNotifications_whenNone_returnsEmptyList() {
        when(notificationRepository.findAllActiveNotifications()).thenReturn(List.of());

        List<WeatherNotificationDto> result = service.getAllActiveNotifications();

        assertThat(result).isEmpty();
    }

    // ---------- getNotificationStats ----------

    @Test
    @DisplayName("getNotificationStats counts total, active and unique notification types")
    void getNotificationStats_aggregatesCounts() {
        UserEntity user = owner();
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(user));
        when(notificationRepository.findByUserId(7L)).thenReturn(List.of(
                notificationEntity(1L, user, true, WeatherNotificationType.FROST_WARNING),
                notificationEntity(2L, user, false, WeatherNotificationType.FROST_WARNING),
                notificationEntity(3L, user, true, WeatherNotificationType.TEMP_HIGH)));

        WeatherNotificationService.NotificationStats stats = service.getNotificationStats(NICKNAME);

        assertThat(stats.getTotalNotifications()).isEqualTo(3L);
        assertThat(stats.getActiveNotifications()).isEqualTo(2L);
        assertThat(stats.getUniqueTypes()).isEqualTo(2L);
    }

    @Test
    @DisplayName("getNotificationStats returns all-zero counts when the user has no notifications")
    void getNotificationStats_whenNone_returnsZeros() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.of(owner()));
        when(notificationRepository.findByUserId(7L)).thenReturn(List.of());

        WeatherNotificationService.NotificationStats stats = service.getNotificationStats(NICKNAME);

        assertThat(stats.getTotalNotifications()).isZero();
        assertThat(stats.getActiveNotifications()).isZero();
        assertThat(stats.getUniqueTypes()).isZero();
    }

    @Test
    @DisplayName("getNotificationStats throws when the user does not exist")
    void getNotificationStats_whenUserMissing_throws() {
        when(userRepository.findByNickname(NICKNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getNotificationStats(NICKNAME))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found: " + NICKNAME);
        verify(notificationRepository, never()).findByUserId(any());
    }
}
