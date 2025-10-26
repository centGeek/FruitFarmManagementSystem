package fruit.farm.management.service;

import fruit.farm.management.dto.SectorLaborCostDTO;
import fruit.farm.management.dto.WorkDetailsDTO;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.exception.ExceededWorkHoursException;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class WorkScheduleService {

    private UserRepository userRepository;
    private SectorService sectorService;
    private WorkEntryRepository workEntryRepository;
    private WorkDetailsService workDetailsService;

    @Transactional
    public List<WorkEntryEntity> createWorkSchedule(List<WorkEntryDto> requests, UserEntity gardener) {

        List<WorkEntryEntity> entriesToSave = new ArrayList<>();

        for (WorkEntryDto request : requests) {
            log.info("Processing entry for userId: {}", request.getUser());

            UserEntity user = userRepository.findByEmail(request.getUser().getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getUser().getEmail()));

            if (!user.getGardener().getId().equals(gardener.getId())) {
                throw new RuntimeException("User does not belong to logged gardener");
            }

            WorkEntryEntity entry = new WorkEntryEntity();
            entry.setUser(user);
            entry.setWorkType(request.getWorkType());
            entry.setDescription(request.getDescription());
            entry.setCreatedAt(LocalDateTime.now());
            entry.setWorkDate(request.getWorkDate());
            entry.setDuration(request.getDuration());
            entry.setIsPaid(false);
            if (request.getSector() != null) {
                if (request.getSector().getId() != null) {
                    SectorEntity sector = sectorService.findById(request.getSector().getId())
                            .orElseThrow(() -> new RuntimeException("Sector not found with ID: " + request.getSector().getId()));
                    entry.setSector(sector);
                }
            }
            Optional<WorkDetailsDTO> latestWorkDetailsForUser = workDetailsService.getLatestWorkDetailsForUserByEmail(
                    request.getUser().getEmail());
            BigDecimal salary = latestWorkDetailsForUser
                    .map(workDetailsDTO -> DailySalaryCalculator.calculateDailySalary(request, workDetailsDTO))
                    .orElse(BigDecimal.ZERO);
            entry.setDaySalary(salary);
            log.info("Day salary is set: " + salary);
            validateWorkEntries(requests, entry.getDuration());

            entriesToSave.add(entry);
        }

        return workEntryRepository.saveAll(entriesToSave);
    }

    private void validateWorkEntries(List<WorkEntryDto> requests, int duration) {

        List<WorkEntryEntity> workEntriesByGivenDayForGardener = workEntryRepository.findWorkEntriesByGivenDayForEmployee(requests);
        int durationCalculated = duration;
        for (WorkEntryEntity workEntryEntity : workEntriesByGivenDayForGardener) {
            durationCalculated += workEntryEntity.getDuration();
        }
        if (durationCalculated > 18) {
            throw new ExceededWorkHoursException("You can not work more than 18 hours per given day.");
        }
    }

    public WorkEntryEntity updateWorkEntry(WorkEntryDto request, Optional<WorkEntryEntity> optionalEntry) {

        WorkEntryEntity existingEntry = optionalEntry.get();

        int durationDiff = request.getDuration() - existingEntry.getDuration();
        validateWorkEntries(List.of(request), durationDiff);


        existingEntry.setDuration(request.getDuration());

        if (request.getDescription() != null) {
            existingEntry.setDescription(request.getDescription());
        }

        if (request.getWorkType() != null) {
            existingEntry.setWorkType(request.getWorkType());
        }
        existingEntry.setIsPaid(request.getIsPaid());
        Optional<WorkDetailsDTO> latestWorkDetailsForUserByEmail = workDetailsService
                .getLatestWorkDetailsForUserByEmail(request.getUser().getEmail());
        BigDecimal salary = latestWorkDetailsForUserByEmail
                .map(workDetailsDTO -> DailySalaryCalculator.calculateDailySalary(request, workDetailsDTO))
                .orElse(BigDecimal.ZERO);

        existingEntry.setDaySalary(salary);

        if (request.getSector().getId() != null) {
            SectorEntity sector = sectorService.findById(request.getSector().getId())
                    .orElseThrow(() -> new RuntimeException("Sector not found"));
            existingEntry.setSector(sector);
        }
        return workEntryRepository.save(existingEntry);
    }

    public int payAllUnpaidEntries(UserEntity employee) {
        return workEntryRepository.payAllUnpaidEntries(employee.getId());
    }

    public int payAllUnpaidEntriesForCurrentMonth(UserEntity employee) {
        return workEntryRepository.payAllUnpaidEntriesForCurrentMonth(employee.getId());
    }

    public SectorLaborCostDTO calculateSectorLaborCosts(Long sectorId, Integer year, Integer month) {

        List<WorkEntryEntity> entries = workEntryRepository.findAllExpensesByGivenDate(year, month, sectorId);

        String sectorName = sectorId != null
                ? sectorService.findById(sectorId)
                .map(s -> s.getDescription() != null ? s.getDescription() : "Sektor " + s.getSectorId())
                .orElse("Wszystkie sektory")
                : "Wszystkie sektory";

        BigDecimal totalCost = entries.stream()
                .map(WorkEntryEntity::getDaySalary).reduce(BigDecimal::add).get();

        Optional<BigDecimal> paidCost = entries.stream()
                .filter(WorkEntryEntity::getIsPaid)
                .map(WorkEntryEntity::getDaySalary).reduce(BigDecimal::add);

        Optional<BigDecimal> unpaidCost = entries.stream()
                .filter(e -> !e.getIsPaid())
                .map(WorkEntryEntity::getDaySalary).reduce(BigDecimal::add);

        int totalEntries = entries.size();
        int paidEntries = (int) entries.stream().filter(WorkEntryEntity::getIsPaid).count();
        int unpaidEntries = totalEntries - paidEntries;
        if (paidCost.isEmpty()) {
            paidCost = Optional.of(BigDecimal.valueOf(0));
        }
        if (unpaidCost.isEmpty()) {
            unpaidCost = Optional.of(BigDecimal.valueOf(0));
        }

        return new SectorLaborCostDTO(
                sectorName,
                totalCost,
                paidCost.get(),
                unpaidCost.get(),
                totalEntries,
                paidEntries,
                unpaidEntries
        );
    }
}
