package fruit.farm.management.service;

import fruit.farm.management.dto.UserDto;
import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkDetailsEntity;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkDetailsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkDetailsService")
class WorkDetailsServiceTest {

    @Mock
    WorkDetailsRepository workDetailsRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    WorkDetailsService service;

    private UserEntity userEntity(long id, String nickname) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setNickname(nickname);
        return user;
    }

    private WorkDetailsDto inputDto(String nickname) {
        UserDto owner = new UserDto();
        owner.setNickname(nickname);
        WorkDetailsDto dto = new WorkDetailsDto();
        dto.setIsPaidHourly(true);
        dto.setHourlyPay(new BigDecimal("30.00"));
        dto.setPayPerKilogram(new BigDecimal("1.10"));
        dto.setUserDTO(owner);
        return dto;
    }

    @Test
    @DisplayName("createWorkDetails resolves the user by nickname, saves and returns the DTO")
    void createWorkDetails_whenUserExists_savesAndReturnsDto() {
        when(userRepository.findByNickname("john")).thenReturn(Optional.of(userEntity(3L, "john")));
        WorkDetailsEntity saved = new WorkDetailsEntity(11L, true, new BigDecimal("30.00"),
                new BigDecimal("1.10"), LocalDateTime.now(), userEntity(3L, "john"));
        when(workDetailsRepository.save(any())).thenReturn(saved);

        WorkDetailsDto result = service.createWorkDetails(inputDto("john"));

        assertThat(result.getId()).isEqualTo(11L);
        assertThat(result.getIsPaidHourly()).isTrue();
        assertThat(result.getHourlyPay()).isEqualByComparingTo("30.00");
        verify(workDetailsRepository).save(any());
    }

    @Test
    @DisplayName("createWorkDetails throws when the user nickname is unknown")
    void createWorkDetails_whenUserNotFound_throws() {
        when(userRepository.findByNickname("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createWorkDetails(inputDto("ghost")))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ghost");
        verify(workDetailsRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateWorkDetails overwrites pay fields on the existing entity")
    void updateWorkDetails_whenFound_updatesPayFields() {
        WorkDetailsEntity existing = new WorkDetailsEntity(5L, true, new BigDecimal("20.00"),
                new BigDecimal("0.90"), LocalDateTime.now(), userEntity(3L, "john"));
        when(workDetailsRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(workDetailsRepository.save(existing)).thenReturn(existing);

        WorkDetailsDto patch = new WorkDetailsDto();
        patch.setIsPaidHourly(false);
        patch.setHourlyPay(new BigDecimal("0.00"));
        patch.setPayPerKilogram(new BigDecimal("1.50"));

        WorkDetailsDto result = service.updateWorkDetails(5L, patch);

        assertThat(result.getIsPaidHourly()).isFalse();
        assertThat(result.getPayPerKilogram()).isEqualByComparingTo("1.50");
        assertThat(existing.getPayPerKilogram()).isEqualByComparingTo("1.50");
    }

    @Test
    @DisplayName("updateWorkDetails throws when the id does not exist")
    void updateWorkDetails_whenNotFound_throws() {
        when(workDetailsRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateWorkDetails(99L, new WorkDetailsDto()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("deleteWorkDetails deletes when the entity exists")
    void deleteWorkDetails_whenExists_deletes() {
        when(workDetailsRepository.existsById(8L)).thenReturn(true);

        service.deleteWorkDetails(8L);

        verify(workDetailsRepository).deleteById(8L);
    }

    @Test
    @DisplayName("deleteWorkDetails throws and skips deletion when the entity is missing")
    void deleteWorkDetails_whenMissing_throws() {
        when(workDetailsRepository.existsById(8L)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteWorkDetails(8L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("8");
        verify(workDetailsRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("getLatestWorkDetailsForUser maps the entity when present")
    void getLatestWorkDetailsForUser_whenPresent_mapsEntity() {
        WorkDetailsEntity entity = new WorkDetailsEntity(2L, false, new BigDecimal("0.00"),
                new BigDecimal("2.00"), LocalDateTime.now(), userEntity(3L, "john"));
        when(workDetailsRepository.getLatestWorkDetailsForUserByGardenerId(3L))
                .thenReturn(Optional.of(entity));

        Optional<WorkDetailsDto> result = service.getLatestWorkDetailsForUser(3L);

        assertThat(result).isPresent();
        assertThat(result.get().getPayPerKilogram()).isEqualByComparingTo("2.00");
    }

    @Test
    @DisplayName("getLatestWorkDetailsForUser returns empty when none found")
    void getLatestWorkDetailsForUser_whenEmpty_returnsEmpty() {
        when(workDetailsRepository.getLatestWorkDetailsForUserByGardenerId(3L))
                .thenReturn(Optional.empty());

        assertThat(service.getLatestWorkDetailsForUser(3L)).isEmpty();
    }
}
