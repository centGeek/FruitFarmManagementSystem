package fruit.farm.management.controller;

import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.service.UserService;
import fruit.farm.management.service.WorkDetailsService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.UnsatisfiedServletRequestParameterException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/work-details")
@AllArgsConstructor
@Slf4j
public class WorkDetailsController {

    private final WorkDetailsService workDetailsService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<WorkDetailsDTO>> getAllWorkDetails() {

        return ResponseEntity.ok(workDetailsService.getAllWorkDetails());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WorkDetailsDTO>> getWorkDetailsByUser(@PathVariable Long userId) {

        return ResponseEntity.ok(workDetailsService.getWorkDetailsByUserId(userId));
    }

    @GetMapping("/user/{userId}/latest")
    public ResponseEntity<WorkDetailsDTO> getLatestWorkDetailsForUser(@PathVariable Long userId) {

        Optional<WorkDetailsDTO> details = workDetailsService.getLatestWorkDetailsForUser(userId);

        return details.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<WorkDetailsDTO> createWorkDetails(@RequestBody WorkDetailsDTO dto) {

        try {
            WorkDetailsDTO created = workDetailsService.createWorkDetails(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.error("Błąd walidacji: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkDetailsDTO> updateWorkDetails(
            @PathVariable Long id,
            @RequestBody WorkDetailsDTO dto) {

        log.info("PUT /api/work-details/{} - Aktualizacja detali pracy", id);
        try {
            WorkDetailsDTO updated = workDetailsService.updateWorkDetails(id, dto);
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