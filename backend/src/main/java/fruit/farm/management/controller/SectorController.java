package fruit.farm.management.controller;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.service.SectorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sectors")
@RequiredArgsConstructor
@Slf4j
public class SectorController {

    @Autowired
    private SectorService sectorService;

    @PostMapping
    public ResponseEntity<SectorDTO> createSector(@Valid @RequestBody SectorDTO sectorDTO) {

        try {
            sectorDTO.setId(System.currentTimeMillis());
            SectorDTO sector = sectorService.createSector(sectorDTO);
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

        try {
            log.info("Sector updated (mock): {}", sectorDTO);
            return ResponseEntity.ok(sectorDTO);

        } catch (Exception e) {
            log.error("Error updating sector", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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

    @GetMapping
    public ResponseEntity<List<SectorDTO>> getAllSectors() {

        try {
            return ResponseEntity.ok(sectorService.getAllSectors());
        } catch (Exception e) {
            log.error("Error getting all sectors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}