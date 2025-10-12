package fruit.farm.management.repository;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.ExpenseMapper;
import fruit.farm.management.repository.jpa.ExpenseJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Repository
@AllArgsConstructor
public class ExpenseRepository {

    private final ExpenseJpaRepository expenseJpaRepository;

    public ExpenseDTO addExpense(ExpenseEntity expenseEntity) {
        expenseEntity.setCreatedAt(LocalDate.now());
        ExpenseEntity saved = expenseJpaRepository.save(expenseEntity);
        return ExpenseMapper.mapFromEntity(saved);
    }

    public List<ExpenseDTO> getAllExpensesByGardener(long userId) {
        return expenseJpaRepository.getAllExpensesByGardener(userId)
                .stream()
                .map(ExpenseMapper::mapFromEntity)
                .collect(Collectors.toList());
    }

    public ExpenseDTO getExpenseById(Long id) {
        ExpenseEntity expense = expenseJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wydatek nie znaleziony"));
        return ExpenseMapper.mapFromEntity(expense);
    }

    public ExpenseDTO updateExpense(Long id, ExpenseDTO expenseDto, UserEntity userEntity) {
        ExpenseEntity existing = expenseJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wydatek nie istnieje"));

        if (!existing.getUserEntity().getId().equals(userEntity.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak dostępu do tego wydatku");
        }

        existing.setProductType(expenseDto.getType());
        existing.setExpenseCost(expenseDto.getAmount());
        existing.setDescription(expenseDto.getDescription());
        existing.setPaid(expenseDto.isPaid());
        existing.setCreatedAt(expenseDto.getCreatedAt());

        ExpenseEntity updated = expenseJpaRepository.save(existing);
        return ExpenseMapper.mapFromEntity(updated);
    }

    public void deleteExpense(Long id, UserEntity userEntity) {
        ExpenseEntity existing = expenseJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wydatek nie istnieje"));

        if (!existing.getUserEntity().getId().equals(userEntity.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak dostępu do tego wydatku");
        }

        expenseJpaRepository.delete(existing);
    }

    public Page<ExpenseDTO> getAllExpensesByGardenerPaginated(Long userId, Pageable pageable) {
        Page<ExpenseEntity> page = expenseJpaRepository.findByUserId(userId, pageable);
        return page.map(ExpenseMapper::mapFromEntity);
    }
}