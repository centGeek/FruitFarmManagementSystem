package fruit.farm.management.repository;

import fruit.farm.management.dto.AdvancePayDTO;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.AdvancePayEntity;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.mapper.AdvancePayMapper;
import fruit.farm.management.repository.jpa.AdvancePayJpaRepository;
import fruit.farm.management.repository.jpa.WorkEntryJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class WorkEntryRepository {

    private final WorkEntryJpaRepository workEntryJpaRepository;
    private final AdvancePayRepository advancePayRepository;

    public Optional<WorkEntryEntity> findById(Long id) {
        return workEntryJpaRepository.findById(id);
    }

    public WorkEntryEntity save(WorkEntryEntity workEntryEntity) {

        return workEntryJpaRepository.save(workEntryEntity);
    }

    public void delete(WorkEntryEntity entry) {

        workEntryJpaRepository.delete(entry);
    }

    public List<WorkEntryEntity> saveAll(List<WorkEntryEntity> entriesToSave) {
        return workEntryJpaRepository.saveAll(entriesToSave);
    }

    public List<WorkEntryEntity> findWorkEntriesByGivenDayForEmployee(List<WorkEntryDto> requests) {

        if (requests.isEmpty()) {
            return new ArrayList<>();
        }
        return workEntryJpaRepository.findWorkEntriesByGivenDayForEmployee(requests.get(0).getUser().getEmail(),
                requests.get(0).getWorkDate());
    }

    public List<WorkEntryEntity> findAllExpensesByGivenDate(Integer year, Integer month, Long sectorId, Long userId) {

        return workEntryJpaRepository.findAllExpensesByGivenDate(year, month, sectorId, userId);
    }

    public List<WorkEntryEntity> findAllExpensesByGivenDate(Integer year, Integer month) {

        return workEntryJpaRepository.findAllExpensesByGivenDate(year, month);
    }

    public int payAllUnpaidEntries(long employeeId) {

        advancePayRepository.settleAdvancePayEntries(employeeId);

        return workEntryJpaRepository.payAllUnpaidEntries(employeeId);
    }

    public int payAllUnpaidEntriesForCurrentMonth(long employeeId) {

        return workEntryJpaRepository.payAllUnpaidEntriesForCurrentMonth(employeeId);
    }

    public List<WorkEntryEntity> findByUserGardenerIdAndWorkDateBetween(Long id, LocalDate startDate, LocalDate endDate) {

        return workEntryJpaRepository.findByUserGardenerIdAndWorkDateBetween(id, startDate, endDate);
    }

    public List<WorkEntryEntity> getUnpaidEntriesByUserId(Long userId) {

        return workEntryJpaRepository.getUnpaidEntriesByUserId(userId);
    }

    public AdvancePayEntity saveAdvance(UserEntity employee, BigDecimal amount, String description, LocalDate advanceDate) {

        AdvancePayEntity advance = new AdvancePayEntity();
        advance.setUser(employee);
        advance.setAmount(amount);
        advance.setDescription(description);
        advance.setCreatedAt(advanceDate);
        advance.setSettled(false);

        return advancePayRepository.save(advance);
    }

    public List<AdvancePayDTO> getUnsettledAdvancesByUserId(Long userId) {

        return workEntryJpaRepository.getUnsettledAdvancesByUserId(userId)
                .stream()
                .map(AdvancePayMapper::mapToDTO).toList();
    }

    public List<AdvancePayDTO> getUnsettledAdvancesByGardenerId(Long userId) {

        return workEntryJpaRepository.getUnsettledAdvancesByGardenerId(userId)
                .stream()
                .map(AdvancePayMapper::mapToDTO).toList();
    }
}