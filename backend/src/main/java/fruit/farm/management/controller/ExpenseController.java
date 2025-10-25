package fruit.farm.management.controller;

import fruit.farm.management.dto.ExpenseDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.mapper.ExpenseMapper;
import fruit.farm.management.repository.ExpenseRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Slf4j
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final SectorService sectorService;
    private final WorkEntryRepository workEntryRepository;

    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@Valid @RequestBody ExpenseDTO expenseDto) {
        UserEntity userEntity = userService.getLoggedUser();
        log.info("Creating expense for User ID: {}", userEntity.getId());

        if (expenseDto.getSectorDTO() != null) {
            SectorDTO sectorById = sectorService.getSectorById(expenseDto.getSectorDTO().getId());
            expenseDto.setSectorDTO(sectorById);
        }

        try {
            ExpenseEntity expenseEntity = ExpenseMapper.mapToEntity(expenseDto, userEntity);
            ExpenseDTO createdExpense = expenseRepository.addExpense(expenseEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
        } catch (Exception e) {
            log.error("Error creating expense: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie udało się stworzyć wydatku");
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        UserEntity user = userService.getLoggedUser();
        log.info("Fetching expenses for User ID: {} - Page: {}, Size: {}", user.getId(), page, size);

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

            Page<ExpenseDTO> expensePage = expenseRepository.getAllExpensesByGardenerPaginated(
                    user.getId(),
                    pageable
            );

            Map<String, Object> response = new HashMap<>();
            response.put("content", expensePage.getContent());
            response.put("currentPage", expensePage.getNumber());
            response.put("totalElements", expensePage.getTotalElements());
            response.put("totalPages", expensePage.getTotalPages());
            response.put("pageSize", expensePage.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching expenses for user {}: {}", user.getId(), e.getMessage(), e);
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

        UserEntity user = userService.getLoggedUser();
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
        UserEntity user = userService.getLoggedUser();
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

    @GetMapping("/sector-labor-costs")
    public ResponseEntity<Map<String, Object>> getSectorLaborCosts(
            @RequestParam(required = false) Long sectorId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        UserEntity user = userService.getLoggedUser();
        log.info("Calculating labor costs for Sector ID: {}, Year: {}, Month: {}", sectorId, year, month);

        try {
            String sectorName;
            if (sectorId != null) {
                SectorDTO sector = sectorService.getSectorById(sectorId);
                sectorName = sector.getDescription();
            } else {
                sectorName = "Wszystkie sektory";
            }

            List<WorkEntryEntity> laborExpenses;
            if (sectorId != null) {
                laborExpenses = workEntryRepository.findAllExpensesByGivenDate(year, month, sectorId);

            } else {
                laborExpenses = workEntryRepository.findAllExpensesByGivenDate(year, month);
            }


            BigDecimal totalLaborCost = BigDecimal.ZERO;
            BigDecimal sectorLaborCost = BigDecimal.ZERO;

            List<SectorDTO> allSectors = sectorService.getAllSectorsByUserId(user.getId());
            int totalSectors = allSectors.size();

            if (totalSectors > 0) {
                for (WorkEntryEntity expense : laborExpenses) {
                    totalLaborCost = totalLaborCost.add(expense.getDaySalary());

                    if (sectorId != null) {
                        if (expense.getSector() != null &&
                                expense.getSector().getSectorId() == (sectorId)) {
                            sectorLaborCost = sectorLaborCost.add(expense.getDaySalary());
                        }
                        else if (expense.getSector() == null) {
                            BigDecimal proportionalCost = expense.getDaySalary()
                                    .divide(BigDecimal.valueOf(totalSectors), 2, RoundingMode.HALF_UP);
                            sectorLaborCost = sectorLaborCost.add(proportionalCost);
                        }
                    }
                    else {
                        sectorLaborCost = sectorLaborCost.add(expense.getDaySalary());
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("sectorId", sectorId);
            response.put("sectorName", sectorName);
            response.put("totalLaborCost", totalLaborCost);
            response.put("sectorLaborCost", sectorLaborCost);
            response.put("calculationMethod", "proportional");
            response.put("totalSectors", totalSectors);
            response.put("year", year);
            response.put("month", month);
            response.put("expenseCount", laborExpenses.size());
            System.out.println(response);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error calculating labor costs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}