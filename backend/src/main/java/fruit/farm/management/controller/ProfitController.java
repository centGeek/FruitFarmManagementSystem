package fruit.farm.management.controller;

import fruit.farm.management.dto.ProfitDto;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProfitType;
import fruit.farm.management.service.ProfitService;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
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
@RequestMapping("/api/profits")
@RequiredArgsConstructor
@Slf4j
public class ProfitController {

    private final ProfitService profitService;
    private final UserService userService;
    private final SectorService sectorService;

    @PostMapping
    public ResponseEntity<ProfitDto> createProfit(@Valid @RequestBody ProfitDto profitDto) {
        UserDto userDto = userService.getLoggedUser();
        log.info("Creating profit for User ID: {}", userDto.getId());

        if (profitDto.getSectorDTO() != null) {
            SectorDTO sectorById = sectorService.getSectorById(profitDto.getSectorDTO().getId());
            profitDto.setSectorDTO(sectorById);
        }

        try {
            ProfitDto createdProfit = profitService.addProfit(profitDto, userDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProfit);
        } catch (Exception e) {
            log.error("Error creating profit: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie udało się stworzyć przychodu");
        }
    }

    @GetMapping
    public ResponseEntity<Page<ProfitResponse>> getAllProfits(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @PageableDefault(sort = "purchaseId", direction = Sort.Direction.DESC, size = 100) Pageable pageable) {

        UserDto user = userService.getLoggedUser();
        log.info("Fetching profits for User ID: {}, Year: {}, Month: {} - {}",
                user.getId(), year, month, pageable);

        Page<ProfitDto> profits = profitService.getAllPaginatedProfitsByGardener(
                user.getId(), year, month, pageable);

        Page<ProfitResponse> result = profits.map(dto -> new ProfitResponse(
                dto.getPurchaseId(),
                dto.getProfit(),
                dto.getCreatedAt(),
                dto.getProfitType(),
                dto.getDescription(),
                dto.isReceived(),
                dto.getSectorDTO()));

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfitDto> getProfitById(@PathVariable Long id) {
        try {
            ProfitDto profit = profitService.getProfitById(id);
            return ResponseEntity.ok(profit);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching profit ID {}: {}", id, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Przychód nie istnieje");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfitDto> updateProfit(
            @PathVariable Long id,
            @Valid @RequestBody ProfitDto profitDto) {

        UserDto user = userService.getLoggedUser();
        log.info("Updating profit ID: {} for User ID: {}", id, user.getId());

        try {
            ProfitDto updatedProfit = profitService.updateProfit(id, profitDto, user);
            return ResponseEntity.ok(updatedProfit);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating profit ID {} for user {}: {}", id, user.getId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się zaktualizować przychodu");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfit(@PathVariable Long id) {
        UserDto user = userService.getLoggedUser();
        log.info("Deleting profit ID: {} for User ID: {}", id, user.getId());

        try {
            profitService.deleteProfit(id, user);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting profit ID {} for user {}: {}", id, user.getId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się usunąć przychodu");
        }
    }

    public record ProfitResponse(
            Long purchaseId,
            BigDecimal profit,
            LocalDate createdAt,
            ProfitType profitType,
            String description,
            boolean received,
            SectorDTO sectorDTO
    ) {}
}