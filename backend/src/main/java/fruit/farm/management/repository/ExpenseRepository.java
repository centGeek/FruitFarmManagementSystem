package fruit.farm.management.repository;

import fruit.farm.management.dto.ExpenseDto;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.ExpenseMapper;
import fruit.farm.management.repository.jpa.ExpenseJpaRepository;
import fruit.farm.management.service.SectorService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@AllArgsConstructor
public class ExpenseRepository {

    private final ExpenseJpaRepository expenseJpaRepository;
    private final SectorService sectorService;

    public ExpenseDto addExpense(ExpenseEntity expenseEntity) {

        ExpenseEntity saved = expenseJpaRepository.save(expenseEntity);
        return ExpenseMapper.mapFromEntity(saved);
    }

    public List<ExpenseDto> getAllExpensesByGardener(long userId) {
        return expenseJpaRepository.getAllExpensesByGardener(userId)
                .stream()
                .map(ExpenseMapper::mapFromEntity)
                .collect(Collectors.toList());
    }

    public ExpenseDto getExpenseById(Long id) {
        ExpenseEntity expense = expenseJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wydatek nie znaleziony"));
        return ExpenseMapper.mapFromEntity(expense);
    }

    public ExpenseDto updateExpense(Long id, ExpenseDto expenseDto, UserEntity userEntity) {
        ExpenseEntity existing = expenseJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wydatek nie istnieje"));

        if (!existing.getUserEntity().getId().equals(userEntity.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak dostępu do tego wydatku");
        }
        Optional<SectorEntity> sectorEntityOptional = sectorService.findById(expenseDto.getSectorDTO().getId());
        existing.setProductType(expenseDto.getType());
        existing.setExpenseCost(expenseDto.getAmount());
        existing.setDescription(expenseDto.getDescription());
        existing.setPaid(expenseDto.isPaid());
        existing.setCreatedAt(expenseDto.getCreatedAt());
        sectorEntityOptional.ifPresent(existing::setSectorEntity);

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

    public Page<ExpenseDto> getAllExpensesByGardenerPaginated(Long userId, Integer year, Integer month, Pageable pageable,
                                                              Long sectorId) {
        Page<ExpenseEntity> page = expenseJpaRepository.findFilteredByUserId(userId, year, month, pageable, sectorId);
        return page.map(ExpenseMapper::mapFromEntity);
    }
}