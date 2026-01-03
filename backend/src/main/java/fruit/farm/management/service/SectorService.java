package fruit.farm.management.service;

import fruit.farm.management.dto.CoordinateDTO;
import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.CoordinateMapper;
import fruit.farm.management.mapper.SectorMapper;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.SectorRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class SectorService {

    private final SectorRepository sectorRepository;
    private final NotificationService notificationService;


    @Transactional
    public SectorDTO createSector(SectorDTO sectorDTO, UserEntity userEntity) {

        SectorEntity sector = new SectorEntity();
        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
        sector.setCreatedAt(LocalDate.now());
        sector.setUserEntity(userEntity);
        sector.setVariety(sectorDTO.getVariety());
        sector.setCoordinates(CoordinateMapper.mapToEntities(sectorDTO.getCoordinates(), sector));
        sector.setIsActive(true);

        SectorEntity savedSector = sectorRepository.save(sector);
        notificationService.addSectorNotification(NotificationDTO.builder()
                .title("Dodano nowy sektor w gospodarstwie!")
                .message("Dodano sektor: " + savedSector.getDescription() +
                        " z uprawą: " + savedSector.getPlantType() + " i odmianą: " + savedSector.getVariety())
                .createdAt(LocalDateTime.now())
                .userDTO(UserMapper.mapFromEntity(userEntity))
                .build(), userEntity);

        return convertToDTO(savedSector);
    }


    public SectorDTO updateSector(SectorDTO sectorDTO) {
        SectorEntity sector = sectorRepository.findById(sectorDTO.getId())
                .orElseThrow(() -> new RuntimeException("Sector not found"));

        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
        sector.setVariety(sectorDTO.getVariety());
        sector.setIsActive(sectorDTO.getIsActive());

        List<CoordinateEntity> coordsBefore = sector.getCoordinates();
        List<CoordinateEntity> coordsAfter = new ArrayList<>();

        for (int i = 0; i < coordsBefore.size(); i++) {

            CoordinateEntity coordinateEntity = coordsBefore.get(i);
            coordinateEntity.setLatitude(sectorDTO.getCoordinates().get(i).getLatitude());
            coordinateEntity.setLongitude(sectorDTO.getCoordinates().get(i).getLongitude());
            coordsAfter.add(coordinateEntity);
        }

        sector.setCoordinates(coordsAfter);
        SectorEntity savedSector = sectorRepository.save(sector);
        return convertToDTO(savedSector);
    }

    public SectorDTO getSectorById(Long id) {
        SectorEntity sector = sectorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sector not found"));
        return convertToDTO(sector);
    }

    public List<SectorDTO> getAllActiveSectorsByUserId(long userId) {
        return sectorRepository.findAllActiveByUserId(userId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<SectorDTO> getAllArchivedSectorsByUserId(long userId) {
        return sectorRepository.findAllArchivedByUserId(userId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    private SectorDTO convertToDTO(SectorEntity sector) {
        SectorDTO dto = new SectorDTO();
        dto.setId(sector.getSectorId());
        dto.setDescription(sector.getDescription());
        dto.setCoordinates(CoordinateMapper.mapFromEntities(sector.getCoordinates(), sector));
        dto.setPlantType(sector.getPlantType());
        dto.setVariety(sector.getVariety());
        dto.setCreatedAt(sector.getCreatedAt());

        return dto;
    }

    public List<SectorDTO> updateSectors(List<SectorDTO> sectorDTOs, Long userId) {
        List<SectorDTO> updatedSectors = new ArrayList<>();

        for (SectorDTO sectorDTO : sectorDTOs) {
            SectorEntity existingSector = sectorRepository.findById(sectorDTO.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Sector not found: " + sectorDTO.getId()));

            if (!existingSector.getUserEntity().getId().equals(userId)) {
                throw new SecurityException("Unauthorized access to sector: " + sectorDTO.getId());
            }

            existingSector.setDescription(sectorDTO.getDescription());
            existingSector.setPlantType(sectorDTO.getPlantType());
            existingSector.setVariety(sectorDTO.getVariety());

            existingSector.getCoordinates().clear();


            for (CoordinateDTO coordDTO : sectorDTO.getCoordinates()) {
                CoordinateEntity coordEntity = new CoordinateEntity();
                coordEntity.setLatitude(coordDTO.getLatitude());
                coordEntity.setLongitude(coordDTO.getLongitude());
                coordEntity.setSector(existingSector);
                existingSector.getCoordinates().add(coordEntity);
            }

            SectorEntity saved = sectorRepository.save(existingSector);

            SectorDTO updated = SectorMapper.mapToDTO(saved);
            updatedSectors.add(updated);
        }

        return updatedSectors;
    }

    public Optional<SectorEntity> findById(long id) {

        return sectorRepository.findById(id);
    }
}