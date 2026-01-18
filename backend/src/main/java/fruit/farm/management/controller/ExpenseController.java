package fruit.farm.management.controller;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.SectorLaborCostDTO;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProductType;
import fruit.farm.management.service.ExpenseService;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import fruit.farm.management.service.WorkScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Slf4j
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserService userService;
    private final SectorService sectorService;
    private final WorkScheduleService workScheduleService;

    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@Valid @RequestBody ExpenseDTO expenseDto) {

        UserDto userDto = userService.getLoggedUser();
        log.info("Creating expense for User ID: {}", userDto.getId());

        if (expenseDto.getSectorDTO() != null) {
            SectorDTO sectorById = sectorService.getSectorById(expenseDto.getSectorDTO().getId());
            expenseDto.setSectorDTO(sectorById);
        }

        try {
            ExpenseDTO createdExpense = expenseService.addExpense(expenseDto, userDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
        } catch (Exception e) {
            log.error("Error creating expense: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie udało się stworzyć wydatku");
        }
    }

    @GetMapping
    public ResponseEntity<Page<ExpenseResponse>> getExpenses(

            @PageableDefault(sort = "expenseId", direction = Sort.Direction.DESC, size = 15) Pageable pageable) {
        UserDto user = userService.getLoggedUser();
        log.info("Fetching expenses for User ID: {} - {}", user.getId(), pageable);
        Page<ExpenseDTO> expensePage = expenseService.getAllPaginatedExpensesByGardener(user.getId(), pageable);
        Page<ExpenseResponse> result = expensePage.map(dto -> new ExpenseResponse(
                dto.getId(), dto.getAmount(), dto.getCreatedAt(), dto.getType(), dto.getDescription(),
                dto.isPaid(), dto.getSectorDTO()));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getExpenseById(@PathVariable Long id) {

        try {
            ExpenseDTO expense = expenseService.getExpenseById(id);
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

        UserDto user = userService.getLoggedUser();
        log.info("Updating expense ID: {} for User ID: {}", id, user.getId());

        try {
            ExpenseDTO updatedExpense = expenseService.updateExpense(id, expenseDto, user);
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

        UserDto user = userService.getLoggedUser();
        log.info("Deleting expense ID: {} for User ID: {}", id, user.getId());

        try {
            expenseService.deleteExpense(id, user);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting expense ID {} for user {}: {}", id, user.getId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się usunąć wydatku");
        }
    }

    @GetMapping("/sector-labor-costs")
    public ResponseEntity<SectorLaborCostDTO> getSectorLaborCosts(
            @RequestParam(required = false) Long sectorId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        UserDto user = userService.getLoggedUser();
        log.info("Calculating labor costs for User ID: {}, Sector ID: {}, Year: {}, Month: {}",
                user.getId(), sectorId, year, month);

        try {
            SectorLaborCostDTO laborCosts = workScheduleService.calculateSectorLaborCosts(
                    sectorId, user.getId(), year, month);
            return ResponseEntity.ok(laborCosts);
        } catch (Exception e) {
            log.error("Error calculating labor costs: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Nie udało się obliczyć kosztów pracy");
        }
    }

    public record ExpenseResponse(
            Long id,
            BigDecimal amount,
            LocalDate createdAt,
            ProductType type,
            String description,
            boolean paid,
            Object sectorDTO
    ) {}
}