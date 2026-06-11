package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.ProfitDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProfitType;
import fruit.farm.management.repository.ProfitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProfitService")
class ProfitServiceTest {

    @Mock
    ProfitRepository profitRepository;

    @Mock
    NotificationService notificationService;

    @InjectMocks
    ProfitService service;

    @Captor
    ArgumentCaptor<NotificationDto> notificationCaptor;

    private UserDto gardener;

    @BeforeEach
    void setUp() {
        gardener = new UserDto();
        gardener.setId(4L);
    }

    private ProfitDto profit(String description, BigDecimal amount) {
        return new ProfitDto(null, LocalDate.of(2026, 6, 11), ProfitType.SPRZEDAZ_JABLEK,
                500L, amount, description, true, 4L, null);
    }

    @Test
    @DisplayName("addProfit returns the repository result and notifies using its fields")
    void addProfit_returnsRepositoryResultAndNotifies() {
        ProfitDto persisted = profit("Apple sale to wholesaler", new BigDecimal("4200.00"));
        when(profitRepository.addProfit(any())).thenReturn(persisted);

        ProfitDto result = service.addProfit(profit("input", new BigDecimal("1.00")), gardener);

        assertThat(result).isSameAs(persisted);
        verify(notificationService).addProfitNotification(notificationCaptor.capture(), eq(gardener));
        NotificationDto sent = notificationCaptor.getValue();
        assertThat(sent.getTitle()).isEqualTo("Dodano nowy przychód!");
        assertThat(sent.getMessage())
                .contains("Apple sale to wholesaler")
                .contains("SPRZEDAZ_JABLEK")
                .contains("4200.00");
        assertThat(sent.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("getAllProfitsByGardener delegates to the repository")
    void getAllProfitsByGardener_delegatesToRepository() {
        List<ProfitDto> expected = List.of(profit("x", new BigDecimal("10.00")));
        when(profitRepository.getAllProfitsByGardener(4L)).thenReturn(expected);

        assertThat(service.getAllProfitsByGardener(4L)).isEqualTo(expected);
        verify(profitRepository).getAllProfitsByGardener(4L);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("getProfitById delegates to the repository")
    void getProfitById_delegatesToRepository() {
        ProfitDto expected = profit("y", new BigDecimal("20.00"));
        when(profitRepository.getProfitById(15L)).thenReturn(expected);

        assertThat(service.getProfitById(15L)).isSameAs(expected);
        verify(profitRepository).getProfitById(15L);
    }

    @Test
    @DisplayName("updateProfit delegates to the repository")
    void updateProfit_delegatesToRepository() {
        ProfitDto patch = profit("z", new BigDecimal("30.00"));
        ProfitDto updated = profit("z-updated", new BigDecimal("31.00"));
        when(profitRepository.updateProfit(9L, patch, gardener)).thenReturn(updated);

        assertThat(service.updateProfit(9L, patch, gardener)).isSameAs(updated);
        verify(profitRepository).updateProfit(9L, patch, gardener);
    }

    @Test
    @DisplayName("deleteProfit delegates with the mapped user")
    void deleteProfit_delegatesWithMappedUser() {
        service.deleteProfit(6L, gardener);

        verify(profitRepository).deleteProfit(eq(6L), any());
    }
}
