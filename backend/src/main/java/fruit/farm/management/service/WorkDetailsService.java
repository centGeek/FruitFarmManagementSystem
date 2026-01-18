package fruit.farm.management.service;

import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkDetailsEntity;
import fruit.farm.management.mapper.WorkDetailsMapper;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkDetailsRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static fruit.farm.management.mapper.WorkDetailsMapper.mapToDTO;

@Service
@AllArgsConstructor
@Slf4j
public class WorkDetailsService {

    private final WorkDetailsRepository workDetailsRepository;
    private final UserRepository userRepository;

    public List<WorkDetailsDto> getAllWorkDetails() {
        return workDetailsRepository.findAll().stream()
                .map(WorkDetailsMapper::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkDetailsDto> getWorkDetailsByUserId(Long userId) {
        return workDetailsRepository.findByUserEntityId(userId).stream()
                .map(WorkDetailsMapper::mapToDTO)
                .collect(Collectors.toList());
    }

    public Optional<WorkDetailsDto> getLatestWorkDetailsForUser(Long userId) {

        Optional<WorkDetailsEntity> workDetailsEntity = workDetailsRepository.getLatestWorkDetailsForUserByGardenerId(userId);
        return workDetailsEntity.map(WorkDetailsMapper::mapFromEntity);
    }

    public Optional<WorkDetailsDto> getLatestWorkDetailsForUserByNickname(String nickname) {

        Optional<WorkDetailsEntity> workDetailsForUserByNickname = workDetailsRepository.getLatestWorkDetailsForUserByNickname(nickname);
        return workDetailsForUserByNickname.map(WorkDetailsMapper::mapFromEntity);
    }

    @Transactional
    public WorkDetailsDto createWorkDetails(WorkDetailsDto dto) {


        String nickname = dto.getUserDTO().getNickname();
        UserEntity user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono użytkownika o nickname: " + nickname));

        WorkDetailsEntity entity = new WorkDetailsEntity();
        entity.setIsPaidHourly(dto.getIsPaidHourly());
        entity.setHourlyPay(dto.getHourlyPay());
        entity.setPayPerKilogram(dto.getPayPerKilogram());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUserEntity(user);

        WorkDetailsEntity saved = workDetailsRepository.save(entity);
        log.info("Zapisano detale pracy o ID: {}", saved.getId());

        return mapToDTO(saved);
    }

    @Transactional
    public WorkDetailsDto updateWorkDetails(Long id, WorkDetailsDto dto) {
        log.info("Aktualizacja detali pracy ID: {}", id);

        WorkDetailsEntity entity = workDetailsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono detali pracy o ID: " + id));

        entity.setIsPaidHourly(dto.getIsPaidHourly());
        entity.setHourlyPay(dto.getHourlyPay());
        entity.setPayPerKilogram(dto.getPayPerKilogram());

        WorkDetailsEntity updated = workDetailsRepository.save(entity);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteWorkDetails(Long id) {
        log.info("Usuwanie detali pracy ID: {}", id);
        if (!workDetailsRepository.existsById(id)) {
            throw new RuntimeException("Nie znaleziono detali pracy o ID: " + id);
        }
        workDetailsRepository.deleteById(id);
    }

    public Optional<WorkDetailsDto> getLatestWorkDetailsByGardener(long id) {
        Optional<WorkDetailsEntity> latestWorkDetailsByGardener = workDetailsRepository.getLatestWorkDetailsByGardener(id);
        return latestWorkDetailsByGardener.map(WorkDetailsMapper::mapToDTO);
    }

}