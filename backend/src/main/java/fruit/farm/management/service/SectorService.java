package fruit.farm.management.service;

import fruit.farm.management.dto.CoordinateDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.repository.SectorRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@AllArgsConstructor
public class SectorService {

    @Autowired
    private SectorRepository sectorRepository;

    public SectorDTO createSector(SectorDTO sectorDTO) {

        SectorEntity sector = new SectorEntity();
        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
        sector.setCreatedAt(LocalDate.now());

        SectorEntity savedSector = sectorRepository.save(sector);

        return convertToDTO(savedSector);
    }

    public SectorDTO updateSector(SectorDTO sectorDTO) {
        SectorEntity sector = sectorRepository.findById(sectorDTO.getId())
                .orElseThrow(() -> new RuntimeException("Sector not found"));

        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
//        sector.setCoordinates(convertCoordinatesToJson(sectorDTO.getCoordinates()));

//        Double area = calculateArea(sectorDTO.getCoordinates());

        SectorEntity savedSector = sectorRepository.save(sector);
        return convertToDTO(savedSector);
    }

    public void deleteSector(Long id) {
        sectorRepository.deleteById(id);
    }

    public SectorDTO getSector(Long id) {
        SectorEntity sector = sectorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sector not found"));
        return convertToDTO(sector);
    }

    public List<SectorDTO> getAllSectors() {
        return sectorRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Helper methods
    private SectorDTO convertToDTO(SectorEntity sector) {
        SectorDTO dto = new SectorDTO();
        dto.setId(sector.getSectorId());
        dto.setDescription(sector.getDescription());
        dto.setPlantType(sector.getPlantType());
//        dto.setCoordinates(convertJsonToCoordinates(sector.getCoordinates()));
        dto.setCreatedAt(sector.getCreatedAt());;
        return dto;
    }

    private String convertCoordinatesToJson(List<CoordinateDTO> coordinates) {
        // Implementacja konwersji do JSON string dla bazy danych
        // Można użyć Jackson ObjectMapper
        return ""; // placeholder
    }

    private List<CoordinateDTO> convertJsonToCoordinates(String coordinatesJson) {
        // Implementacja konwersji z JSON string
        return List.of(); // placeholder
    }

    private Double calculateArea(List<CoordinateDTO> coordinates) {
        // Implementacja obliczania powierzchni wielokąta
        // Shoelace formula
        return 0.0; // placeholder
    }

}