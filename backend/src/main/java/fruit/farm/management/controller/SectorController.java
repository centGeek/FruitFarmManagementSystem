package fruit.farm.management.controller;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sectors")
@AllArgsConstructor
@Slf4j
public class SectorController {

    private SectorService sectorService;

    private UserService userService;

    @PostMapping
    public ResponseEntity<SectorDTO> createSector(@Valid @RequestBody SectorDTO sectorDTO) {

        try {
            SectorDTO sector = sectorService.createSector(sectorDTO, userService.getLoggedUser());
            log.info("Sector created with ID: {} and description: {}", sector.getId(), sector.getDescription());
            return ResponseEntity.status(HttpStatus.CREATED).body(sectorDTO);

        } catch (Exception e) {
            log.error("Error creating sector", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SectorDTO> updateSector(
            @PathVariable Long id,
            @Valid @RequestBody SectorDTO sectorDTO) {

        log.info("Received PUT request to update sector ID: {}", id);
        sectorDTO.setId(id);
        sectorService.updateSector(sectorDTO);

        return ResponseEntity.ok(sectorDTO);
    }

    @GetMapping()
    public ResponseEntity<List<SectorDTO>> getAllSectorsByUserId() {
        List<SectorDTO> sectorDTOS;
        try {
                Long currentUserId = userService.getLoggedUser().getId();
            sectorDTOS = sectorService.getAllActiveSectorsByUserId(currentUserId);
        } catch (Exception e) {
            log.error("Error getting all sectors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok(sectorDTOS);
    }

    @GetMapping("/archived")
    public ResponseEntity<List<SectorDTO>> getAllArchivedSectorsByUserId() {

        List<SectorDTO> sectorDTOS;
        try {
                Long currentUserId = userService.getLoggedUser().getId();
            sectorDTOS = sectorService.getAllArchivedSectorsByUserId(currentUserId);
        } catch (Exception e) {
            log.error("Error getting all sectors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok(sectorDTOS);
    }
}