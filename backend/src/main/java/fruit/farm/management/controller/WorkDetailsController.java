package fruit.farm.management.controller;

import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.service.WorkDetailsService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/work-details")
@AllArgsConstructor
@Slf4j
public class WorkDetailsController {

    private final WorkDetailsService workDetailsService;

    @GetMapping
    public ResponseEntity<List<WorkDetailsDto>> getAllWorkDetails() {

        return ResponseEntity.ok(workDetailsService.getAllWorkDetails());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WorkDetailsDto>> getWorkDetailsByUser(@PathVariable Long userId) {

        return ResponseEntity.ok(workDetailsService.getWorkDetailsByUserId(userId));
    }

    @GetMapping("/user/{userId}/latest")
    public ResponseEntity<WorkDetailsDto> getLatestWorkDetailsForUser(@PathVariable Long userId) {

        Optional<WorkDetailsDto> details = workDetailsService.getLatestWorkDetailsForUser(userId);

        return details.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<WorkDetailsDto> createWorkDetails(@RequestBody WorkDetailsDto dto) {

        try {
            WorkDetailsDto created = workDetailsService.createWorkDetails(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.error("Błąd walidacji: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkDetailsDto> updateWorkDetails(
            @PathVariable Long id,
            @RequestBody WorkDetailsDto dto) {

        log.info("PUT /api/work-details/{} - Aktualizacja detali pracy", id);
        try {
            WorkDetailsDto updated = workDetailsService.updateWorkDetails(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.error("Błąd walidacji: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Błąd: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkDetails(@PathVariable Long id) {

        log.info("DELETE /api/work-details/{} - Usuwanie detali pracy", id);
        try {
            workDetailsService.deleteWorkDetails(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Błąd: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}