package fruit.farm.management.controller;

import fruit.farm.management.dto.AdvancePayDTO;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.mapper.WorkEntryMapper;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import fruit.farm.management.service.WorkScheduleService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/work-entries")
@AllArgsConstructor
@Slf4j
public class WorkEntryController {

    private WorkEntryRepository workEntryRepository;
    private WorkScheduleService workScheduleService;
    private UserRepository userRepository;

    @GetMapping("/week")
    public ResponseEntity<List<WorkEntryDto>> getWorkEntriesForWeek(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            log.info("Logged user: {} - fetching entries from {} to {}", loggedInEmail, startDate, endDate);

            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<WorkEntryEntity> entries = workEntryRepository
                    .findByUserGardenerIdAndWorkDateBetween(gardener.getId(), startDate, endDate);

            List<WorkEntryDto> dtos = entries.stream()
                    .map(WorkEntryMapper::mapToDto)
                    .collect(Collectors.toList());

            log.info("Found {} work entries for week {} to {}", dtos.size(), startDate, endDate);
            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            log.error("Error fetching work entries for week: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

        @GetMapping("/user/{userId}/unpaid")
        public ResponseEntity<List<WorkEntryDto>> getUnpaidEntriesByUserId(@PathVariable Long userId) {
            List<WorkEntryDto> unpaidEntries = workScheduleService.getUnpaidEntriesByUserId(userId);
            return ResponseEntity.ok(unpaidEntries);
        }
    @GetMapping("/{id}")
    public ResponseEntity<?> getWorkEntryById(@PathVariable Long id) {

        log.info("Getting work entry by ID: {}", id);
        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryDto dto = WorkEntryMapper.mapToDto(optionalEntry.get());
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("Error getting work entry by ID: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get work entry: " + e.getMessage()));
        }
    }

    @PostMapping()
    public ResponseEntity<?> createWorkEntries(@RequestBody List<WorkEntryDto> requests) {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String loggedInEmail = authentication.getName();
            UserEntity gardener = userRepository.findByEmail(loggedInEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            List<WorkEntryEntity> savedEntries = workScheduleService.createWorkSchedule(requests, gardener);

            List<WorkEntryDto> dtos = savedEntries.stream()
                    .map(WorkEntryMapper::mapToDto)
                    .toList();

            log.info("Successfully created {} work entries", savedEntries.size());

            return ResponseEntity.ok(Map.of(
                    "message", "Work entries created successfully",
                    "count", savedEntries.size(),
                    "entries", dtos
            ));

        } catch (Exception e) {
            log.error("Error creating bulk work entries: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Błąd w rejestracji pracy: " + e.getMessage()));
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkEntry(@PathVariable Long id, @RequestBody WorkEntryDto request) {

        log.info("Update request body: {}", request);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity updatedWorkEntry = workScheduleService.updateWorkEntry(request, optionalEntry);
            WorkEntryDto dto = WorkEntryMapper.mapToDto(updatedWorkEntry);

            log.info("Work entry updated successfully with ID: {}", id);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry updated successfully",
                    "entry", dto
            ));

        } catch (Exception e) {
            log.error("Error updating work entry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<?> toggleApproval(@PathVariable Long id, @RequestBody Map<String, Boolean> approvalRequest) {
        log.info("Attempting to toggle approval for work entry ID: {}", id);
        log.info("Approval request: {}", approvalRequest);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity entry = optionalEntry.get();

            Boolean newPaymentStatus = approvalRequest.get("isApproved");
            if (newPaymentStatus == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Missing 'isApproved' field in request"));
            }

            log.info("Changing work entry {} approval from {} to {}",
                    id, entry.getIsPaid(), newPaymentStatus);

            entry.setIsPaid(newPaymentStatus);
            workEntryRepository.save(entry);

            String action = newPaymentStatus ? "approved" : "unapproved";
            log.info("Work entry {} successfully {}", id, action);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry approval status updated successfully",
                    "id", id.toString(),
                    "isApproved", newPaymentStatus.toString(),
                    "action", action
            ));

        } catch (Exception e) {
            log.error("Error toggling approval: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Approval update failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorkEntry(@PathVariable Long id) {
        log.info("Attempting to delete work entry with ID: {}", id);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity entry = optionalEntry.get();
            workEntryRepository.delete(entry);
            log.info("Work entry {} deleted successfully", id);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry deleted successfully",
                    "id", id.toString()
            ));

        } catch (Exception e) {
            log.error("Error deleting work entry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/paid")
    public ResponseEntity<?> togglePaid(@PathVariable Long id, @RequestBody Map<String, Boolean> paidRequest) {
        log.info("Attempting to toggle paid status for work entry ID: {}", id);
        log.info("Paid request: {}", paidRequest);

        try {
            Optional<WorkEntryEntity> optionalEntry = workEntryRepository.findById(id);
            if (optionalEntry.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Work entry not found with ID: " + id));
            }

            WorkEntryEntity entry = optionalEntry.get();

            Boolean newPaidStatus = paidRequest.get("isPaid");
            if (newPaidStatus == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Missing 'isPaid' field in request"));
            }

            log.info("Changing work entry {} paid status from {} to {}",
                    id, entry.getIsPaid(), newPaidStatus);

            entry.setIsPaid(newPaidStatus);
            workEntryRepository.save(entry);

            String action = newPaidStatus ? "paid" : "unpaid";
            log.info("Work entry {} successfully marked as {}", id, action);

            return ResponseEntity.ok(Map.of(
                    "message", "Work entry paid status updated successfully",
                    "id", id.toString(),
                    "isPaid", newPaidStatus.toString(),
                    "action", action
            ));

        } catch (Exception e) {
            log.error("Error toggling paid status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Paid status update failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/user/{userId}/pay-all-and-settle")
    public ResponseEntity<?> payAllUnpaidForUser(@PathVariable Long userId) {
        log.info("Attempting to mark all unpaid entries as paid for user ID: {}", userId);

        try {
            UserEntity employee = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + userId));

            int count = workScheduleService.payAllUnpaidEntries(employee);

            log.info("Successfully marked {} unpaid entries as paid for user {}", count, userId);

            return ResponseEntity.ok(Map.of(
                    "message", "All unpaid work entries marked as paid successfully up to today",
                    "userId", userId.toString(),
                    "count", count
            ));

        } catch (RuntimeException e) {
            log.error("Error during payAllUnpaid for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Internal error during payAllUnpaid for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Mass payment failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/user/{userId}/pay-month-and-settle")
    public ResponseEntity<?> payAllUnpaidForUserMonth(@PathVariable Long userId) {
         log.info("Attempting to mark all unpaid entries in the current month as paid for user ID: {}", userId);

        try {
            UserEntity employee = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + userId));

            int count = workScheduleService.payAllUnpaidEntriesForCurrentMonth(employee);

            log.info("Successfully marked {} unpaid entries in the current month as paid for user {}", count, userId);

            return ResponseEntity.ok(Map.of(
                    "message", "All unpaid work entries for the current month marked as paid successfully",
                    "userId", userId.toString(),
                    "count", count
            ));

        } catch (RuntimeException e) {
            log.error("Error during payAllUnpaidForMonth for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Internal error during payAllUnpaidForMonth for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Mass payment for month failed: " + e.getMessage()));
        }
    }
}