package fruit.farm.management.controller;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.ExpenseMapper;
import fruit.farm.management.repository.ExpenseRepository;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Slf4j
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final SectorService sectorService;

    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@Valid @RequestBody ExpenseDTO expenseDto) {
        UserEntity userEntity = userService.getLoggedInUserId();
        log.info("Creating expense for User ID: {}", userEntity.getId());

        SectorDTO sectorById = sectorService.getSectorById(expenseDto.getSectorDTO().getId());
        expenseDto.setSectorDTO(sectorById);

        try {
            ExpenseEntity expenseEntity = ExpenseMapper.mapToEntity(expenseDto, userEntity);
            ExpenseDTO createdExpense = expenseRepository.addExpense(expenseEntity);
            for (ExpenseDTO expenseDTO : expenseRepository.getAllExpensesByGardener(userEntity.getId())) {
                System.out.println("description" + expenseDTO.getDescription());
                System.out.println("type" + expenseDTO.getType());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
        } catch (Exception e) {
            log.error("Error creating expense: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie udało się stworzyć wydatku");
        }
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDTO>> getAllExpenses() {
        UserEntity user = userService.getLoggedInUserId();
        log.info("Fetching expenses for User ID: {}", user.getId());

        try {
            List<ExpenseDTO> expenses = expenseRepository.getAllExpensesByGardener(user.getId());
            return ResponseEntity.ok(expenses);
        } catch (Exception e) {
            log.error("Error fetching expenses for user {}: {}", user.getId(), e.getMessage(), e);
            for (ExpenseDTO expenseDTO : expenseRepository.getAllExpensesByGardener(user.getId())) {
                System.out.println("isPaid" + expenseDTO.isPaid());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getExpenseById(@PathVariable Long id) {
        try {
            ExpenseDTO expense = expenseRepository.getExpenseById(id);
            return ResponseEntity.ok(expense);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching expense ID {}: {}", id, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Wydatek nie istnieje");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseDTO expenseDto) {

        UserEntity user = userService.getLoggedInUserId();
        log.info("Updating expense ID: {} for User ID: {}", id, user.getId());

        try {
            ExpenseDTO updatedExpense = expenseRepository.updateExpense(id, expenseDto, user);
            return ResponseEntity.ok(updatedExpense);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating expense ID {} for user {}: {}", id, user.getId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się zaktualizować wydatku");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        UserEntity user = userService.getLoggedInUserId();
        log.info("Deleting expense ID: {} for User ID: {}", id, user.getId());

        try {
            expenseRepository.deleteExpense(id, user);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting expense ID {} for user {}: {}", id, user.getId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się usunąć wydatku");
        }
    }
}
