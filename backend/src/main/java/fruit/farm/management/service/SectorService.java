package fruit.farm.management.service;

import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.CoordinateMapper;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.SectorRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class SectorService {

    private final SectorRepository sectorRepository;

    public SectorService(SectorRepository sectorRepository) {
        this.sectorRepository = sectorRepository;
    }

    public SectorDTO createSector(SectorDTO sectorDTO, UserEntity userEntity) {

        SectorEntity sector = new SectorEntity();
        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
        sector.setCreatedAt(LocalDate.now());
        sector.setUserEntity(userEntity);
        sector.setCoordinates(CoordinateMapper.mapToEntities(sectorDTO.getCoordinates(), sector));

        SectorEntity savedSector = sectorRepository.save(sector);

        return convertToDTO(savedSector);
    }

    public void updateSector(SectorDTO sectorDTO) {
        SectorEntity sector = sectorRepository.findById(sectorDTO.getId())
                .orElseThrow(() -> new RuntimeException("Sector not found"));

        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
        sector.setCoordinates(CoordinateMapper.mapToEntities(sectorDTO.getCoordinates(), sector));

        SectorEntity savedSector = sectorRepository.save(sector);
        convertToDTO(savedSector);
    }

    public SectorDTO getSector(Long id) {
        SectorEntity sector = sectorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sector not found"));
        return convertToDTO(sector);
    }

    public List<SectorDTO> getAllSectorsByUserId(long userId) {
        return sectorRepository.findAllByUserId(userId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    private SectorDTO convertToDTO(SectorEntity sector) {
        SectorDTO dto = new SectorDTO();
        dto.setId(sector.getSectorId());
        dto.setDescription(sector.getDescription());
        dto.setCoordinates(CoordinateMapper.mapFromEntities(sector.getCoordinates(), sector));
        dto.setPlantType(sector.getPlantType());
        dto.setCreatedAt(sector.getCreatedAt());;
        return dto;
    }
}