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
            sectorDTO.setId(System.currentTimeMillis());
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
            sectorDTOS = sectorService.getAllSectorsByUserId(currentUserId);
        } catch (Exception e) {
            log.error("Error getting all sectors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok(sectorDTOS);
    }

//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> deleteSector(@PathVariable Long id) {
//        log.info("Received DELETE request for sector ID: {}", id);
//
//        try {
//            log.info("Sector deleted (mock): {}", id);
//            return ResponseEntity.noContent().build();
//        } catch (Exception e) {
//            log.error("Error deleting sector", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }

//    @GetMapping("/{id}")
//    public ResponseEntity<SectorDTO> getSector(@PathVariable Long id) {
//        log.info("Received GET request for sector ID: {}", id);
//
//        try {
//            sectorService.getAllSectors()
//            SectorDTO mockSector = new SectorDTO();
//            mockSector.setId(id);
//            mockSector.setDescription("Mock Sector");
//            return ResponseEntity.ok(mockSector);
//
//        } catch (Exception e) {
//            log.error("Error getting sector", e);
//            return ResponseEntity.notFound().build();
//        }
//    }
}