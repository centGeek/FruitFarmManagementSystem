package fruit.farm.management.controller;

import fruit.farm.management.dto.AdvancePayDto;
import fruit.farm.management.dto.AdvancePaySumDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.service.UserService;
import fruit.farm.management.service.WorkScheduleService;
import lombok.AllArgsConstructor;
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

    private UserService userService;
    private WorkScheduleService workScheduleService;

    @PostMapping
    public ResponseEntity<?> createAdvance(@RequestBody AdvancePayDto request) {

        log.info("Received advance request for user ID: {}, amount: {}", request.getUserId(), request.getAmount());

        if (request.getUserId() == null || request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Missing or invalid getUserId() or amount"));
        }

        try {
            UserEntity employee = userService.findById(request.getUserId())
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

    @GetMapping("/user/{userId}/unsettled")
    public ResponseEntity<List<AdvancePayDto>> getUnsettledAdvancesForEmployee(@PathVariable Long userId) {

        log.info("Attempting to fetch unsettled advances for employee ID: {}", userId);

        try {

            List<AdvancePayDto> unsettledAdvances = workScheduleService.getUnsettledAdvancesByUserId(userId);

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

    @GetMapping("/user/sum-unsettled")
    public ResponseEntity<AdvancePaySumDto> getSumUnsettledAdvancesForEmployee() {

        Long userId = userService.getLoggedUser().getId();
        try {

            AdvancePaySumDto advancePaySumDTO = workScheduleService.getSumUnsettledAdvancesByUserId(userId);

            return ResponseEntity.ok(advancePaySumDTO);

        } catch (RuntimeException e) {
            log.error("Error fetching unsettled advances for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Internal error fetching unsettled advances for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<AdvancePaySumDto> payOffAllUnsettledAdvancePays(@PathVariable Long userId) {

        log.info("Attempting to pay off all unsettled advances for user ID: {}", userId);

        try {

            workScheduleService.payOffAllUnsettledAdvancePays(userId);

            AdvancePaySumDto advancePaySumDTO = workScheduleService.getSumUnsettledAdvancesByUserId(userId);

            log.info("Successfully paid off advances for user {}. New unsettled sum: {}", userId, advancePaySumDTO.getAmount());
            return ResponseEntity.ok(advancePaySumDTO);

        } catch (RuntimeException e) {
            log.error("Error paying off unsettled advances for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Internal error paying off unsettled advances for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
