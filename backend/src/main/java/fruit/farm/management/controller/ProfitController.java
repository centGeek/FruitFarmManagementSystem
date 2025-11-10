package fruit.farm.management.controller;

import fruit.farm.management.dto.ProfitDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.ProfitMapper;
import fruit.farm.management.repository.ProfitRepository;
import fruit.farm.management.service.ProfitService;
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

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profits")
@RequiredArgsConstructor
@Slf4j
public class ProfitController {

    private final ProfitService profitService;
    private final UserService userService;
    private final SectorService sectorService;

    @PostMapping
    public ResponseEntity<ProfitDTO> createProfit(@Valid @RequestBody ProfitDTO profitDto) {
        UserEntity userEntity = userService.getLoggedUser();
        log.info("Creating profit for User ID: {}", userEntity.getId());

        if(profitDto.getSectorDTO() != null) {
            SectorDTO sectorById = sectorService.getSectorById(profitDto.getSectorDTO().getId());
            profitDto.setSectorDTO(sectorById);
        }

        try {
            ProfitEntity profitEntity = ProfitMapper.mapToEntity(profitDto, userEntity);
            ProfitDTO createdProfit = profitService.addProfit(profitEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProfit);
        } catch (Exception e) {
            log.error("Error creating profit: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie udało się stworzyć przychodu");
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProfits(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        UserEntity user = userService.getLoggedUser();
        log.info("Fetching profits for User ID: {} - Page: {}, Size: {}", user.getId(), page, size);

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

            Page<ProfitDTO> profitPage = profitService.getAllProfitsByGardenerPaginated(
                    user.getId(),
                    pageable
            );

            Map<String, Object> response = new HashMap<>();
            response.put("content", profitPage.getContent());
            response.put("currentPage", profitPage.getNumber());
            response.put("totalElements", profitPage.getTotalElements());
            response.put("totalPages", profitPage.getTotalPages());
            response.put("pageSize", profitPage.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching profits for user {}: {}", user.getId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfitDTO> getProfitById(@PathVariable Long id) {
        try {
            ProfitDTO profit = profitService.getProfitById(id);
            return ResponseEntity.ok(profit);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching profit ID {}: {}", id, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Przychód nie istnieje");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfitDTO> updateProfit(
            @PathVariable Long id,
            @Valid @RequestBody ProfitDTO profitDto) {

        UserEntity user = userService.getLoggedUser();
        log.info("Updating profit ID: {} for User ID: {}", id, user.getId());

        try {
            ProfitDTO updatedProfit = profitService.updateProfit(id, profitDto, user);
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
        UserEntity user = userService.getLoggedUser();
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
}