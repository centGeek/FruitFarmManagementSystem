package fruit.farm.management.controller;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.service.SectorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

        if (sectorDTO.getId() != null) {
            return ResponseEntity.badRequest().build();
        }

//        SectorDTO createdSector = sectorService.createSector(sectorDTO);
//        return ResponseEntity.status(HttpStatus.OK).body(createdSector);
        return null;
    }

    @PutMapping("/{id}")
    public ResponseEntity<SectorDTO> updateSector(
            @PathVariable Long id,
            @Valid @RequestBody SectorDTO sectorDTO) {

        sectorDTO.setId(id);

//        SectorDTO updatedSector = sectorService.updateSector(sectorDTO);
        return null;
//        return ResponseEntity.ok(updatedSector);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSector(@PathVariable Long id) {
//        sectorService.deleteSector(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SectorDTO> getSector(@PathVariable Long id) {
//        SectorDTO sector = sectorService.getSector(id);
//        return ResponseEntity.ok(sector);
        return null;
    }

    @GetMapping
    public ResponseEntity<List<SectorDTO>> getAllSectors() {
//        List<SectorDTO> sectors = sectorService.getAllSectors();
//        return ResponseEntity.ok(sectors);
        return null;
    }
}