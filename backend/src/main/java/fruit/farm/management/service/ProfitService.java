package fruit.farm.management.service;

import fruit.farm.management.dto.NotificationDTO;
import fruit.farm.management.dto.ProfitDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.ProfitEntity;
import fruit.farm.management.mapper.ProfitMapper;
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
    public ProfitDto addProfit(ProfitDto profitDto, UserDto userDto) {

        ProfitEntity profitEntity = ProfitMapper.mapToEntity(profitDto, userDto);
        ProfitDto profitDTO = profitRepository.addProfit(profitEntity);
        notificationService.addProfitNotification(NotificationDTO.builder()
                        .title("Dodano nowy przychód!")
                        .message("Opis przychodu: " + profitDTO.getDescription() + " typu: " + profitDTO.getProfitType()
                        + " z wartością: " + profitDTO.getProfit())
                        .createdAt(LocalDateTime.now())
                        .userDto(userDto).build(),
                userDto);
        return profitDTO;
    }

    public List<ProfitDto> getAllProfitsByGardener(long userId) {

        return profitRepository.getAllProfitsByGardener(userId);
    }

    public ProfitDto getProfitById(Long id) {

        return profitRepository.getProfitById(id);
    }

    public ProfitDto updateProfit(Long id, ProfitDto profitDto, UserDto userDto) {

        return profitRepository.updateProfit(id, profitDto, userDto);
    }

    public void deleteProfit(Long id, UserDto userDto) {

        profitRepository.deleteProfit(id, UserMapper.mapToEntity(userDto, null));
    }

    public Page<ProfitDto> getAllProfitsByGardenerPaginated(Long userId, Pageable pageable) {

        return profitRepository.getAllProfitsByGardenerPaginated(userId, pageable);
    }
}
