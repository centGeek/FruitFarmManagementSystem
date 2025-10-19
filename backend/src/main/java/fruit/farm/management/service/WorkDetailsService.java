package fruit.farm.management.service;

import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkDetailsEntity;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.mapper.WorkDetailsMapper;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkDetailsRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class WorkDetailsService {

    private final WorkDetailsRepository workDetailsRepository;
    private final UserRepository userRepository;

    public List<WorkDetailsDTO> getAllWorkDetails() {
        return workDetailsRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkDetailsDTO> getWorkDetailsByUserId(Long userId) {
        return workDetailsRepository.findByUserEntityId(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public WorkDetailsDTO getLatestWorkDetailsForUser(Long userId) {

        return WorkDetailsMapper.mapFromEntity(workDetailsRepository.findTopByUserEntityIdOrderByCreatedAtDesc(userId));
    }

    public WorkDetailsDTO getLatestWorkDetailsForUserByEmail(String email) {

        return WorkDetailsMapper.mapFromEntity(workDetailsRepository.getLatestWorkDetailsForUserByEmail(email));
    }

    @Transactional
    public WorkDetailsDTO createWorkDetails(WorkDetailsDTO dto) {


        String email = dto.getUserDTO().getEmail();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono użytkownika o email: " + email));

        WorkDetailsEntity entity = new WorkDetailsEntity();
        entity.setIsPaidHourly(dto.getIsPaidHourly());
        entity.setHourlyPay(dto.getHourlyPay());
        entity.setPayPerKilogram(dto.getPayPerKilogram());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUserEntity(user);

        validateWorkDetailsDTO(dto);

        WorkDetailsEntity saved = workDetailsRepository.save(entity);
        log.info("Zapisano detale pracy o ID: {}", saved.getId());

        return mapToDTO(saved);
    }

    @Transactional
    public WorkDetailsDTO updateWorkDetails(Long id, WorkDetailsDTO dto) {
        log.info("Aktualizacja detali pracy ID: {}", id);

        validateWorkDetailsDTO(dto);

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

    private void validateWorkDetailsDTO(WorkDetailsDTO dto) {

//        if (dto.isPaidHourly()) {
//            if (dto.getHourlyPay() == null || dto.getHourlyPay() <= 0) {
//                throw new IllegalArgumentException("Dla płatności godzinowej wymagana jest stawka godzinowa");
//            }
//            if (dto.getPayPerKilogram() != null) {
//                throw new IllegalArgumentException("Dla płatności godzinowej nie można ustawić stawki za kilogram");
//            }
//        } else {
//            if (dto.getPayPerKilogram() == null || dto.getPayPerKilogram() <= 0) {
//                throw new IllegalArgumentException("Dla płatności od kilogramów wymagana jest stawka za kilogram");
//            }
//            if (dto.getHourlyPay() != null) {
//                throw new IllegalArgumentException("Dla płatności od kilogramów nie można ustawić stawki godzinowej");
//            }
//        }
    }

    private WorkDetailsDTO mapToDTO(WorkDetailsEntity entity) {
        WorkDetailsDTO dto = new WorkDetailsDTO();
        dto.setId(entity.getId());
        dto.setIsPaidHourly(entity.getIsPaidHourly());
        dto.setHourlyPay(entity.getHourlyPay());
        dto.setPayPerKilogram(entity.getPayPerKilogram());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUserDTO(UserMapper.mapFromEntity(entity.getUserEntity()));
        return dto;
    }
}