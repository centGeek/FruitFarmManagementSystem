package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.dto.ProfitDTO;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.ProfitRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
public class ProfitService {

    private final ProfitRepository profitRepository;
    private final NotificationService notificationService;

    @Transactional
    public ProfitDTO addProfit(ProfitEntity profitEntity) {

        ProfitDTO profitDTO = profitRepository.addProfit(profitEntity);
        notificationService.addProfitNotification(NotificationDTO.builder()
                        .title("Dodano nowy przychód!")
                        .message("Opis przychodu: " + profitDTO.getDescription() + " typu: " + profitDTO.getProfitType()
                        + " z wartością: " + profitDTO.getProfit())
                        .createdAt(LocalDateTime.now())
                        .userDTO(UserMapper.mapFromEntity(profitEntity.getUserEntity())).build(),
                profitEntity.getUserEntity());
        return profitDTO;
    }

    public List<ProfitDTO> getAllProfitsByGardener(long userId) {

        return profitRepository.getAllProfitsByGardener(userId);
    }

    public ProfitDTO getProfitById(Long id) {

        return profitRepository.getProfitById(id);
    }

    public ProfitDTO updateProfit(Long id, ProfitDTO profitDto, UserEntity userEntity) {

        return profitRepository.updateProfit(id, profitDto, userEntity);
    }

    public void deleteProfit(Long id, UserEntity userEntity) {

        profitRepository.deleteProfit(id, userEntity);
    }

    public Page<ProfitDTO> getAllProfitsByGardenerPaginated(Long userId, Pageable pageable) {

        return profitRepository.getAllProfitsByGardenerPaginated(userId, pageable);
    }
}
