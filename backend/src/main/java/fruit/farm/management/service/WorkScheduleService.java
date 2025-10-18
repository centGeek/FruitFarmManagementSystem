package fruit.farm.management.service;

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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@AllArgsConstructor
@Slf4j
public class WorkScheduleService {

    private UserRepository userRepository;
    private SectorService sectorService;
    private WorkEntryRepository workEntryRepository;

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
            entry.setIsApproved(request.getIsApproved() != null ? request.getIsApproved() : false);
            entry.setCreatedAt(LocalDateTime.now());
            entry.setWorkDate(request.getWorkDate());
            entry.setDuration(request.getDuration());
            if (request.getSector().getId() != null) {
                SectorEntity sector = sectorService.findById(request.getSector().getId())
                        .orElseThrow(() -> new RuntimeException("Sector not found with ID: " + request.getSector().getId()));
                entry.setSector(sector);
            }

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
        if (request.getIsApproved() != null) {
            existingEntry.setIsApproved(request.getIsApproved());
        }

        if (request.getWorkType() != null) {
            existingEntry.setWorkType(request.getWorkType());
        }

        if (request.getSector().getId() != null) {
            SectorEntity sector = sectorService.findById(request.getSector().getId())
                    .orElseThrow(() -> new RuntimeException("Sector not found"));
            existingEntry.setSector(sector);
        }
        return workEntryRepository.save(existingEntry);
    }
}
