package fruit.farm.management.controller;

import fruit.farm.management.dto.SectorDto;
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
    public ResponseEntity<SectorDto> createSector(@Valid @RequestBody SectorDto sectorDTO) {

        try {
            SectorDto sector = sectorService.createSector(sectorDTO, userService.getLoggedUser());
            log.info("Sector created with ID: {} and description: {}", sector.getId(), sector.getDescription());
            return ResponseEntity.status(HttpStatus.CREATED).body(sectorDTO);

        } catch (Exception e) {
            log.error("Error creating sector", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SectorDto> updateSector(
            @PathVariable Long id,
            @Valid @RequestBody SectorDto sectorDto) {

        log.info("Received PUT request to update sector ID: {}", id);
        sectorDto.setId(id);
        sectorService.updateSector(sectorDto);

        return ResponseEntity.ok(sectorDto);
    }

    @GetMapping()
    public ResponseEntity<List<SectorDto>> getAllSectorsByUserId() {
        List<SectorDto> sectorDtos;
        try {
            Long currentUserId = userService.getLoggedUser().getId();
            sectorDtos = sectorService.getAllActiveSectorsByUserId(currentUserId);
        } catch (Exception e) {
            log.error("Error getting all sectors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok(sectorDtos);
    }

    @GetMapping("/archived")
    public ResponseEntity<List<SectorDto>> getAllArchivedSectorsByUserId() {

        List<SectorDto> sectorDtos;
        try {
            Long currentUserId = userService.getLoggedUser().getId();
            sectorDtos = sectorService.getAllArchivedSectorsByUserId(currentUserId);
        } catch (Exception e) {
            log.error("Error getting all sectors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok(sectorDtos);
    }
}