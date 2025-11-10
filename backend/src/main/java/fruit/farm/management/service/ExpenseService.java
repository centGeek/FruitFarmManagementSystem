package fruit.farm.management.service;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;
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
    public ExpenseDTO addExpense(ExpenseEntity expenseEntity) {

        ExpenseDTO expenseDTO = expenseRepository.addExpense(expenseEntity);
        notificationService.addExpenseNotification(NotificationDTO.builder()
                        .title("Dodano nowy wydatek!")
                        .message("Opis wydatku: " + expenseDTO.getDescription() + " typu: " +
                                expenseEntity.getProductType() + " z wartością: " + expenseDTO.getAmount())
                        .createdAt(LocalDateTime.now())
                        .userDTO(UserMapper.mapFromEntity(expenseEntity.getUserEntity())).build(),
                expenseEntity.getUserEntity());
        return expenseDTO;
    }

    public List<ExpenseDTO> getAllExpensesByGardener(long userId) {

        return expenseRepository.getAllExpensesByGardener(userId);
    }

    public ExpenseDTO getExpenseById(Long id) {

        return expenseRepository.getExpenseById(id);
    }

    public ExpenseDTO updateExpense(Long id, ExpenseDTO expenseDto, UserEntity userEntity) {

        return expenseRepository.updateExpense(id, expenseDto, userEntity);
    }

    public void deleteExpense(Long id, UserEntity userEntity) {

        expenseRepository.deleteExpense(id, userEntity);
    }

    public Page<ExpenseDTO> getAllExpensesByGardenerPaginated(Long userId, Pageable pageable) {

        return expenseRepository.getAllExpensesByGardenerPaginated(userId, pageable);
    }
}
