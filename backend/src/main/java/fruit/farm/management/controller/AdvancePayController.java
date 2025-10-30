package fruit.farm.management.controller;

import fruit.farm.management.dto.AdvancePayDTO;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.service.WorkScheduleService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/advances")
@AllArgsConstructor
@Slf4j
public class AdvancePayController {

    private UserRepository userRepository;
    private WorkScheduleService workScheduleService;
    @PostMapping
    public ResponseEntity<?> createAdvance(@RequestBody AdvancePayDTO request) {

        log.info("Received advance request for user ID: {}, amount: {}", request.getUserId(), request.getAmount());

        if (request.getUserId() == null || request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Missing or invalid getUserId() or amount"));
        }

        try {
            UserEntity employee = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getUserId()));

            workScheduleService.saveAdvance(
                    employee,
                    request.getAmount(),
                    request.getDescription(),
                    LocalDate.now()
            );

            log.info("Advance of {} PLN successfully recorded for user {}", request.getAmount(), request.getUserId());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Advance payment recorded successfully",
                    "getUserId()", request.getUserId().toString(),
                    "amount", request.getAmount().toString()
            ));

        } catch (RuntimeException e) {
            log.error("Error during advance payment for user {}: {}", request.getUserId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Internal error during advance payment for user {}: {}", request.getUserId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Advance payment failed: " + e.getMessage()));
        }
    }

    /**
     * Zwraca listę nieuregulowanych zaliczek dla podanego pracownika.
     * Endpoint: GET /api/advances/user/{userId}/unsettled
     */
    @GetMapping("/user/{userId}/unsettled")
    public ResponseEntity<List<AdvancePayDTO>> getUnsettledAdvancesForEmployee(@PathVariable Long userId) {

        log.info("Attempting to fetch unsettled advances for employee ID: {}", userId);

        try {

            List<AdvancePayDTO> unsettledAdvances = workScheduleService.getUnsettledAdvancesByUserId(userId);

            log.info("Found {} unsettled advance payments for employee {}", unsettledAdvances.size(), userId);
            return ResponseEntity.ok(unsettledAdvances);

        } catch (RuntimeException e) {
            log.error("Error fetching unsettled advances for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Internal error fetching unsettled advances for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
