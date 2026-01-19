package fruit.farm.management.service;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.mapper.ExpenseMapper;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.ExpenseRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final NotificationService notificationService;

    @Transactional
    public ExpenseDTO addExpense(ExpenseDTO expenseDTO, UserDto userDto) {

        ExpenseEntity expenseEntity = ExpenseMapper.mapToEntity(expenseDTO, userDto);
        expenseRepository.addExpense(expenseEntity);
        notificationService.addExpenseNotification(NotificationDTO.builder()
                        .title("Dodano nowy wydatek!")
                        .message("Opis wydatku: " + expenseDTO.getDescription() + " typu: " +
                                expenseDTO.getType() + " z wartością: " + expenseDTO.getAmount())
                        .createdAt(LocalDateTime.now())
                        .userDto(userDto).build(),
                userDto);
        return expenseDTO;
    }

    public List<ExpenseDTO> getAllExpensesByGardener(long userId) {

        return expenseRepository.getAllExpensesByGardener(userId);
    }

    public ExpenseDTO getExpenseById(Long id) {

        return expenseRepository.getExpenseById(id);
    }

    public ExpenseDTO updateExpense(Long id, ExpenseDTO expenseDto, UserDto userDto) {

        return expenseRepository.updateExpense(id, expenseDto, UserMapper.mapToEntity(userDto, null));
    }

    public void deleteExpense(Long id, UserDto userDto) {

        expenseRepository.deleteExpense(id, UserMapper.mapToEntity(userDto, null));
    }

    public Page<ExpenseDTO> getAllPaginatedExpensesByGardener(Long userId, Integer year, Integer month, Pageable pageable) {

        return expenseRepository.getAllExpensesByGardenerPaginated(userId, year, month, pageable);
    }
}
