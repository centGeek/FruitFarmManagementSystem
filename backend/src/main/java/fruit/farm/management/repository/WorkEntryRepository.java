package fruit.farm.management.repository;

import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.ExpenseEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.repository.jpa.WorkEntryJpaRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class WorkEntryRepository {

    private final WorkEntryJpaRepository workEntryJpaRepository;

    public WorkEntryEntity saveOrUpdate(WorkEntryEntity entry) {

        return workEntryJpaRepository.save(entry);
    }

    public Optional<WorkEntryEntity> findById(Long id) {
        return workEntryJpaRepository.findById(id);
    }

    public List<WorkEntryEntity> findAll() {
        return workEntryJpaRepository.findAll();
    }

    public void deleteById(Long id) {
        workEntryJpaRepository.deleteById(id);
    }

    public List<WorkEntryEntity> findByUserGardenerId(Long id) {

        return workEntryJpaRepository.findByUserGardenerId(id);
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

    public List<WorkEntryEntity> findAllExpensesByGivenDate(Integer year, Integer month, Long sectorId) {

        return workEntryJpaRepository.findAllExpensesByGivenDate(year, month, sectorId);
    }

    public List<WorkEntryEntity> findAllExpensesByGivenDate(Integer year, Integer month) {

        return workEntryJpaRepository.findAllExpensesByGivenDate(year, month);
    }

    public int payAllUnpaidEntries(long employeeId) {
        return workEntryJpaRepository.payAllUnpaidEntries(employeeId);
    }

    public int payAllUnpaidEntriesForCurrentMonth(long employeeId) {
        return workEntryJpaRepository.payAllUnpaidEntriesForCurrentMonth(employeeId);
    }
}