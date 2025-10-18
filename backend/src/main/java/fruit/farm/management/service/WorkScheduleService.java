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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
@Slf4j
public class WorkScheduleService {

    private UserRepository userRepository;
    private SectorService sectorService;
    private WorkEntryRepository workEntryRepository;

    public List<WorkEntryEntity> createWorkSchedule(List<WorkEntryDto> requests, UserEntity gardener) {

        List<WorkEntryEntity> workEntriesByGivenDayForGardener = workEntryRepository.findWorkEntriesByGivenDayForEmployee(requests);
        int durationCalculated = 0;
        for (WorkEntryEntity workEntryEntity : workEntriesByGivenDayForGardener) {
            durationCalculated += workEntryEntity.getDuration();
        }
        if (durationCalculated > 18) {
            throw new ExceededWorkHoursException("You can not work more than 18 hours per given day.");
        }

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
            entry.setStartTime(request.getStartTime());
            entry.setEndTime(request.getEndTime());
            entry.setWorkType(request.getWorkType());

            if (request.getStartTime() != null && request.getEndTime() != null) {
                Duration duration = Duration.between(request.getStartTime(), request.getEndTime());
                entry.setDuration(duration.toHoursPart());
            }

            entry.setDescription(request.getDescription());
            entry.setIsApproved(request.getIsApproved() != null ? request.getIsApproved() : false);
            entry.setCreatedAt(LocalDateTime.now());

            if (request.getSector().getId() != null) {
                SectorEntity sector = sectorService.findById(request.getSector().getId())
                        .orElseThrow(() -> new RuntimeException("Sector not found with ID: " + request.getSector().getId()));
                entry.setSector(sector);
            }

            entriesToSave.add(entry);
        }

        return workEntryRepository.saveAll(entriesToSave);
    }
}
