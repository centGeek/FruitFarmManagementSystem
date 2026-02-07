package fruit.farm.management.service;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.SectorDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.SectorEntity;
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
    public SectorDto createSector(SectorDto sectorDTO, UserDto userDto) {

        SectorEntity sector = new SectorEntity();
        sector.setDescription(sectorDTO.getDescription());
        sector.setPlantType(sectorDTO.getPlantType());
        sector.setCreatedAt(LocalDate.now());
        sector.setUserEntity(UserMapper.mapToEntity(userDto, null));
        sector.setVariety(sectorDTO.getVariety());
        sector.setCoordinates(CoordinateMapper.mapToEntities(sectorDTO.getCoordinates(), sector));
        sector.setIsActive(true);

        SectorEntity savedSector = sectorRepository.save(sector);
        notificationService.addSectorNotification(NotificationDto.builder()
                .title("Dodano nowy sektor w gospodarstwie!")
                .message("Dodano sektor: " + savedSector.getDescription() +
                        " z uprawą: " + savedSector.getPlantType() + " i odmianą: " + savedSector.getVariety())
                .createdAt(LocalDateTime.now())
                .userDto(userDto)
                .build(), userDto);

        return convertToDTO(savedSector);
    }


    public void updateSector(SectorDto sectorDto) {
        SectorEntity sector = sectorRepository.findById(sectorDto.getId())
                .orElseThrow(() -> new RuntimeException("Sector not found"));

        sector.setDescription(sectorDto.getDescription());
        sector.setPlantType(sectorDto.getPlantType());
        sector.setVariety(sectorDto.getVariety());

        if(sectorDto.getIsActive() != null) {
            sector.setIsActive(sectorDto.getIsActive());
        }

        List<CoordinateEntity> coordsBefore = sector.getCoordinates();
        List<CoordinateEntity> coordsAfter = new ArrayList<>();

        for (int i = 0; i < coordsBefore.size(); i++) {

            CoordinateEntity coordinateEntity = coordsBefore.get(i);
            coordinateEntity.setLatitude(sectorDto.getCoordinates().get(i).getLatitude());
            coordinateEntity.setLongitude(sectorDto.getCoordinates().get(i).getLongitude());
            coordsAfter.add(coordinateEntity);
        }

        sector.setCoordinates(coordsAfter);
        SectorEntity savedSector = sectorRepository.save(sector);
        convertToDTO(savedSector);
    }

    public SectorDto getSectorById(Long id) {
        SectorEntity sector = sectorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sector not found"));
        return convertToDTO(sector);
    }

    public List<SectorDto> getAllActiveSectorsByUserId(long userId) {
        return sectorRepository.findAllActiveByUserId(userId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<SectorDto> getAllArchivedSectorsByUserId(long userId) {
        return sectorRepository.findAllArchivedByUserId(userId).stream()
                .map(this::convertToDTO)
                .toList();
    }

    private SectorDto convertToDTO(SectorEntity sector) {
        SectorDto dto = new SectorDto();
        dto.setId(sector.getSectorId());
        dto.setDescription(sector.getDescription());
        dto.setCoordinates(CoordinateMapper.mapFromEntities(sector.getCoordinates(), sector));
        dto.setPlantType(sector.getPlantType());
        dto.setVariety(sector.getVariety());
        dto.setCreatedAt(sector.getCreatedAt());

        return dto;
    }

    public List<SectorDto> updateSectors(List<SectorDto> sectorDtos, Long userId) {
        List<SectorDto> updatedSectors = new ArrayList<>();

        for (SectorDto sectorDTO : sectorDtos) {
            SectorEntity existingSector = sectorRepository.findById(sectorDTO.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Sector not found: " + sectorDTO.getId()));

            if (!existingSector.getUserEntity().getId().equals(userId)) {
                throw new SecurityException("Unauthorized access to sector: " + sectorDTO.getId());
            }

            existingSector.setDescription(sectorDTO.getDescription());
            existingSector.setPlantType(sectorDTO.getPlantType());
            existingSector.setVariety(sectorDTO.getVariety());

            existingSector.getCoordinates().clear();


            for (CoordinateDto coordDTO : sectorDTO.getCoordinates()) {
                CoordinateEntity coordEntity = new CoordinateEntity();
                coordEntity.setLatitude(coordDTO.getLatitude());
                coordEntity.setLongitude(coordDTO.getLongitude());
                coordEntity.setSector(existingSector);
                existingSector.getCoordinates().add(coordEntity);
            }

            SectorEntity saved = sectorRepository.save(existingSector);

            SectorDto updated = SectorMapper.mapToDTO(saved);
            updatedSectors.add(updated);
        }

        return updatedSectors;
    }

    public Optional<SectorEntity> findById(long id) {

        return sectorRepository.findById(id);
    }
}