package fruit.farm.management.repository;

import fruit.farm.management.dto.ProfitDTO;
import fruit.farm.management.dto.SectorDTO;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.ProfitMapper;
import fruit.farm.management.mapper.SectorMapper;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.jpa.ProfitJpaRepository;
import fruit.farm.management.service.SectorService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Repository
@AllArgsConstructor
public class ProfitRepository {

    private final ProfitJpaRepository profitJpaRepository;
    private final SectorRepository sectorRepository;

    public ProfitDTO addProfit(ProfitEntity profitEntity) {
        profitEntity.setCreatedAt(LocalDate.now());
        ProfitEntity saved = profitJpaRepository.save(profitEntity);
        return ProfitMapper.mapFromEntity(saved);
    }

    public List<ProfitDTO> getAllProfitsByGardener(long userId) {
        return profitJpaRepository.getAllProfitsByGardener(userId)
                .stream()
                .map(ProfitMapper::mapFromEntity)
                .collect(Collectors.toList());
    }

    public ProfitDTO getProfitById(Long id) {
        ProfitEntity profit = profitJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Revenue is not found"));
        return ProfitMapper.mapFromEntity(profit);
    }

    public ProfitDTO updateProfit(Long id, ProfitDTO profitDto, UserEntity userEntity) {
        ProfitEntity existing = profitJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Revenue doesn't exist"));

        if (!existing.getUserEntity().getId().equals(userEntity.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this resource");
        }

        existing.setProfitType(profitDto.getProfitType());
        existing.setProfit(profitDto.getProfit());
        existing.setDescription(profitDto.getDescription());
        existing.setCreatedAt(profitDto.getCreatedAt());
        existing.setReceived(profitDto.isReceived());

        if (profitDto.getSectorDTO() != null) {
            SectorEntity sectorById = sectorRepository.findById(profitDto.getSectorDTO().getId()).get();
            existing.setSectorEntity(sectorById);
        } else {
            existing.setSectorEntity(null);
        }

        ProfitEntity updated = profitJpaRepository.save(existing);
        return ProfitMapper.mapFromEntity(updated);
    }

    public void deleteProfit(Long id, UserEntity userEntity) {
        ProfitEntity existing = profitJpaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Revenue doesn't exist"));

        if (!existing.getUserEntity().getId().equals(userEntity.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this resource");
        }

        profitJpaRepository.delete(existing);
    }

    public Page<ProfitDTO> getAllProfitsByGardenerPaginated(Long userId, Pageable pageable) {
        Page<ProfitEntity> page = profitJpaRepository.findByUserId(userId, pageable);
        return page.map(ProfitMapper::mapFromEntity);
    }
}