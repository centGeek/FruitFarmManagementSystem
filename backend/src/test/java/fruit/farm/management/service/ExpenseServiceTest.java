package fruit.farm.management.service;

import fruit.farm.management.dto.ExpenseDto;
import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProductType;
import fruit.farm.management.repository.ExpenseRepository;
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
@DisplayName("ExpenseService")
class ExpenseServiceTest {

    @Mock
    ExpenseRepository expenseRepository;

    @Mock
    NotificationService notificationService;

    @InjectMocks
    ExpenseService service;

    @Captor
    ArgumentCaptor<NotificationDto> notificationCaptor;

    private UserDto gardener;

    @BeforeEach
    void setUp() {
        gardener = new UserDto();
        gardener.setId(7L);
    }

    private ExpenseDto sampleExpense() {
        return new ExpenseDto(null, ProductType.NAWOZY, new BigDecimal("199.99"),
                LocalDate.of(2026, 6, 11), "Multi-component fertilizer", false, 7L, null);
    }

    @Test
    @DisplayName("addExpense persists the expense and emits a notification")
    void addExpense_persistsExpenseAndEmitsNotification() {
        ExpenseDto dto = sampleExpense();

        ExpenseDto result = service.addExpense(dto, gardener);

        assertThat(result).isSameAs(dto);
        verify(expenseRepository).addExpense(any());
        verify(notificationService).addExpenseNotification(any(), eq(gardener));
    }

    @Test
    @DisplayName("addExpense builds a notification carrying description, type and amount")
    void addExpense_buildsNotificationWithDescriptionTypeAndAmount() {
        ExpenseDto dto = sampleExpense();

        service.addExpense(dto, gardener);

        verify(notificationService).addExpenseNotification(notificationCaptor.capture(), eq(gardener));
        NotificationDto sent = notificationCaptor.getValue();
        assertThat(sent.getTitle()).isEqualTo("Dodano nowy wydatek!");
        assertThat(sent.getMessage())
                .contains("Multi-component fertilizer")
                .contains("NAWOZY")
                .contains("199.99");
        assertThat(sent.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("getAllExpensesByGardener delegates to the repository")
    void getAllExpensesByGardener_delegatesToRepository() {
        List<ExpenseDto> expected = List.of(sampleExpense());
        when(expenseRepository.getAllExpensesByGardener(7L)).thenReturn(expected);

        List<ExpenseDto> result = service.getAllExpensesByGardener(7L);

        assertThat(result).isEqualTo(expected);
        verify(expenseRepository).getAllExpensesByGardener(7L);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("getExpenseById delegates to the repository")
    void getExpenseById_delegatesToRepository() {
        ExpenseDto expected = sampleExpense();
        when(expenseRepository.getExpenseById(42L)).thenReturn(expected);

        ExpenseDto result = service.getExpenseById(42L);

        assertThat(result).isSameAs(expected);
        verify(expenseRepository).getExpenseById(42L);
    }

    @Test
    @DisplayName("deleteExpense delegates with the mapped user")
    void deleteExpense_delegatesWithMappedUser() {
        service.deleteExpense(5L, gardener);

        verify(expenseRepository).deleteExpense(eq(5L), any());
    }
}
