package fruit.farm.management.service;

import fruit.farm.management.dto.AdvancePayDto;
import fruit.farm.management.dto.AdvancePaySumDto;
import fruit.farm.management.dto.SectorDto;
import fruit.farm.management.dto.SectorLaborCostDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.dto.WorkDetailsDto;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.entity.WorkType;
import fruit.farm.management.exception.ExceededWorkHoursException;
import fruit.farm.management.repository.AdvancePayRepository;
import fruit.farm.management.repository.UserRepository;
import fruit.farm.management.repository.WorkEntryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkScheduleService")
class WorkScheduleServiceTest {

    @Mock
    AdvancePayRepository advancePayRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    SectorService sectorService;

    @Mock
    WorkEntryRepository workEntryRepository;

    @Mock
    WorkDetailsService workDetailsService;

    @InjectMocks
    WorkScheduleService service;

    @Captor
    ArgumentCaptor<List<WorkEntryEntity>> entriesCaptor;

    @Captor
    ArgumentCaptor<WorkEntryEntity> entryCaptor;

    // --- helpers -----------------------------------------------------------

    private UserEntity gardener(long id) {
        UserEntity gardener = new UserEntity();
        gardener.setId(id);
        gardener.setNickname("gardener");
        return gardener;
    }

    private UserEntity employee(long id, UserEntity gardener) {
        UserEntity employee = new UserEntity();
        employee.setId(id);
        employee.setNickname("worker");
        employee.setGardener(gardener);
        return employee;
    }

    private UserDto userDtoWithNickname(String nickname) {
        UserDto dto = new UserDto();
        dto.setNickname(nickname);
        return dto;
    }

    private WorkEntryDto workEntryRequest(int duration) {
        WorkEntryDto dto = new WorkEntryDto();
        dto.setUser(userDtoWithNickname("worker"));
        dto.setWorkDate(LocalDate.of(2026, 6, 13));
        dto.setDuration(duration);
        dto.setDescription("Zbiór jabłek");
        dto.setWorkType(WorkType.HARVEST);
        dto.setKilogramsPicked(0);
        return dto;
    }

    private WorkDetailsDto hourlyWorkDetails(String hourlyPay) {
        return new WorkDetailsDto(true, new BigDecimal(hourlyPay), null, LocalDateTime.now(), null);
    }

    private WorkEntryEntity entryWithSalary(BigDecimal salary, boolean paid) {
        WorkEntryEntity entry = new WorkEntryEntity();
        entry.setDaySalary(salary);
        entry.setIsPaid(paid);
        entry.setDuration(8);
        return entry;
    }

    // --- createWorkSchedule ------------------------------------------------

    @Test
    @DisplayName("createWorkSchedule builds and saves an entry with the calculated salary for an owned employee")
    void createWorkSchedule_whenEmployeeOwnedAndPaidHourly_savesEntryWithSalary() {
        UserEntity gardener = gardener(1L);
        UserEntity worker = employee(2L, gardener);
        WorkEntryDto request = workEntryRequest(8);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));
        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker"))
                .thenReturn(Optional.of(hourlyWorkDetails("25")));
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(workEntryRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<WorkEntryEntity> result = service.createWorkSchedule(List.of(request), gardener);

        verify(workEntryRepository).saveAll(entriesCaptor.capture());
        List<WorkEntryEntity> saved = entriesCaptor.getValue();
        assertThat(saved).hasSize(1);
        WorkEntryEntity entry = saved.get(0);
        assertThat(entry.getUser()).isSameAs(worker);
        assertThat(entry.getWorkType()).isEqualTo(WorkType.HARVEST);
        assertThat(entry.getDescription()).isEqualTo("Zbiór jabłek");
        assertThat(entry.getDuration()).isEqualTo(8);
        assertThat(entry.getIsPaid()).isFalse();
        assertThat(entry.getCreatedAt()).isNotNull();
        assertThat(entry.getSector()).isNull();
        assertThat(entry.getDaySalary()).isEqualByComparingTo("200");
        assertThat(result).isEqualTo(saved);
    }

    @Test
    @DisplayName("createWorkSchedule resolves the sector when the request carries a sector id")
    void createWorkSchedule_whenSectorIdProvided_resolvesAndSetsSector() {
        UserEntity gardener = gardener(1L);
        UserEntity worker = employee(2L, gardener);
        WorkEntryDto request = workEntryRequest(8);
        SectorDto sectorDto = new SectorDto();
        sectorDto.setId(55L);
        request.setSector(sectorDto);
        SectorEntity sectorEntity = new SectorEntity();
        sectorEntity.setSectorId(55L);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));
        when(sectorService.findById(55L)).thenReturn(Optional.of(sectorEntity));
        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(workEntryRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.createWorkSchedule(List.of(request), gardener);

        verify(workEntryRepository).saveAll(entriesCaptor.capture());
        WorkEntryEntity entry = entriesCaptor.getValue().get(0);
        assertThat(entry.getSector()).isSameAs(sectorEntity);
        // No work details -> salary falls back to ZERO.
        assertThat(entry.getDaySalary()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("createWorkSchedule skips sector resolution when the sector id is null")
    void createWorkSchedule_whenSectorWithoutId_doesNotResolveSector() {
        UserEntity gardener = gardener(1L);
        UserEntity worker = employee(2L, gardener);
        WorkEntryDto request = workEntryRequest(8);
        request.setSector(new SectorDto()); // sector present but id null

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));
        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(workEntryRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.createWorkSchedule(List.of(request), gardener);

        verify(sectorService, never()).findById(anyLong());
        verify(workEntryRepository).saveAll(entriesCaptor.capture());
        assertThat(entriesCaptor.getValue().get(0).getSector()).isNull();
    }

    @Test
    @DisplayName("createWorkSchedule throws when the requested user does not exist")
    void createWorkSchedule_whenUserMissing_throwsRuntimeException() {
        UserEntity gardener = gardener(1L);
        WorkEntryDto request = workEntryRequest(8);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createWorkSchedule(List.of(request), gardener))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found with nickname: worker");
        verify(workEntryRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createWorkSchedule throws when the employee belongs to a different gardener")
    void createWorkSchedule_whenEmployeeNotOwned_throwsRuntimeException() {
        UserEntity gardener = gardener(1L);
        UserEntity otherGardener = gardener(99L);
        UserEntity worker = employee(2L, otherGardener);
        WorkEntryDto request = workEntryRequest(8);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));

        assertThatThrownBy(() -> service.createWorkSchedule(List.of(request), gardener))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User does not belong to logged gardener");
        verify(workEntryRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createWorkSchedule throws when the referenced sector cannot be found")
    void createWorkSchedule_whenSectorMissing_throwsRuntimeException() {
        UserEntity gardener = gardener(1L);
        UserEntity worker = employee(2L, gardener);
        WorkEntryDto request = workEntryRequest(8);
        SectorDto sectorDto = new SectorDto();
        sectorDto.setId(404L);
        request.setSector(sectorDto);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));
        when(sectorService.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createWorkSchedule(List.of(request), gardener))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Sector not found with ID: 404");
        verify(workEntryRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createWorkSchedule throws ExceededWorkHoursException when the day total exceeds 18 hours")
    void createWorkSchedule_whenDailyHoursExceedLimit_throwsExceededWorkHoursException() {
        UserEntity gardener = gardener(1L);
        UserEntity worker = employee(2L, gardener);
        WorkEntryDto request = workEntryRequest(10);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));
        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        // Already 10 hours logged that day + the new 10 -> 20 > 18.
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(10);
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of(existing));

        assertThatThrownBy(() -> service.createWorkSchedule(List.of(request), gardener))
                .isInstanceOf(ExceededWorkHoursException.class)
                .hasMessageContaining("more than 18 hours");
        verify(workEntryRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("createWorkSchedule allows a day total exactly at the 18-hour boundary")
    void createWorkSchedule_whenDailyHoursEqualLimit_savesEntry() {
        UserEntity gardener = gardener(1L);
        UserEntity worker = employee(2L, gardener);
        WorkEntryDto request = workEntryRequest(8);

        when(userRepository.findByNickname("worker")).thenReturn(Optional.of(worker));
        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(10); // 10 + 8 = 18, not greater than 18
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of(existing));
        when(workEntryRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<WorkEntryEntity> result = service.createWorkSchedule(List.of(request), gardener);

        assertThat(result).hasSize(1);
        verify(workEntryRepository).saveAll(anyList());
    }

    // --- updateWorkEntry ---------------------------------------------------

    @Test
    @DisplayName("updateWorkEntry updates duration, fields and recalculated salary then saves")
    void updateWorkEntry_whenValid_updatesFieldsAndSaves() {
        WorkEntryDto request = workEntryRequest(6);
        request.setIsPaid(true);
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(4);
        existing.setDescription("old");
        existing.setWorkType(WorkType.WEEDING);
        existing.setIsPaid(false);

        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker"))
                .thenReturn(Optional.of(hourlyWorkDetails("30")));
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(workEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WorkEntryEntity result = service.updateWorkEntry(request, Optional.of(existing));

        verify(workEntryRepository).save(entryCaptor.capture());
        WorkEntryEntity saved = entryCaptor.getValue();
        assertThat(saved.getDuration()).isEqualTo(6);
        assertThat(saved.getDescription()).isEqualTo("Zbiór jabłek");
        assertThat(saved.getWorkType()).isEqualTo(WorkType.HARVEST);
        assertThat(saved.getIsPaid()).isTrue();
        assertThat(saved.getDaySalary()).isEqualByComparingTo("180"); // 6h * 30
        assertThat(result).isSameAs(existing);
    }

    @Test
    @DisplayName("updateWorkEntry keeps existing description and work type when the request omits them")
    void updateWorkEntry_whenDescriptionAndTypeNull_keepsExistingValues() {
        WorkEntryDto request = workEntryRequest(5);
        request.setDescription(null);
        request.setWorkType(null);
        request.setIsPaid(false);
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(5);
        existing.setDescription("keep me");
        existing.setWorkType(WorkType.PRUNING);

        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(workEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.updateWorkEntry(request, Optional.of(existing));

        verify(workEntryRepository).save(entryCaptor.capture());
        WorkEntryEntity saved = entryCaptor.getValue();
        assertThat(saved.getDescription()).isEqualTo("keep me");
        assertThat(saved.getWorkType()).isEqualTo(WorkType.PRUNING);
        assertThat(saved.getDaySalary()).isEqualByComparingTo("0"); // no work details
    }

    @Test
    @DisplayName("updateWorkEntry resolves and assigns the sector when the request carries one")
    void updateWorkEntry_whenSectorProvided_resolvesAndAssignsSector() {
        WorkEntryDto request = workEntryRequest(4);
        request.setIsPaid(false);
        SectorDto sectorDto = new SectorDto();
        sectorDto.setId(7L);
        request.setSector(sectorDto);
        SectorEntity sectorEntity = new SectorEntity();
        sectorEntity.setSectorId(7L);
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(4);

        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(sectorService.findById(7L)).thenReturn(Optional.of(sectorEntity));
        when(workEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.updateWorkEntry(request, Optional.of(existing));

        verify(workEntryRepository).save(entryCaptor.capture());
        assertThat(entryCaptor.getValue().getSector()).isSameAs(sectorEntity);
    }

    @Test
    @DisplayName("updateWorkEntry throws when the request references a missing sector")
    void updateWorkEntry_whenSectorMissing_throwsRuntimeException() {
        WorkEntryDto request = workEntryRequest(4);
        request.setIsPaid(false);
        SectorDto sectorDto = new SectorDto();
        sectorDto.setId(123L);
        request.setSector(sectorDto);
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(4);

        when(workDetailsService.getLatestWorkDetailsForUserByNickname("worker")).thenReturn(Optional.empty());
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of());
        when(sectorService.findById(123L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateWorkEntry(request, Optional.of(existing)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Sector not found");
        verify(workEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateWorkEntry throws ExceededWorkHoursException when the duration increase blows past 18 hours")
    void updateWorkEntry_whenDurationIncreaseExceedsLimit_throwsExceededWorkHoursException() {
        WorkEntryDto request = workEntryRequest(15);
        request.setIsPaid(false);
        WorkEntryEntity existing = new WorkEntryEntity();
        existing.setDuration(5); // diff = 10

        WorkEntryEntity sameDay = new WorkEntryEntity();
        sameDay.setDuration(10); // 10 (diff) + 10 (existing same-day) = 20 > 18
        when(workEntryRepository.findWorkEntriesByGivenDayForEmployee(anyList())).thenReturn(List.of(sameDay));

        assertThatThrownBy(() -> service.updateWorkEntry(request, Optional.of(existing)))
                .isInstanceOf(ExceededWorkHoursException.class)
                .hasMessageContaining("more than 18 hours");
        verify(workEntryRepository, never()).save(any());
    }

    // --- payAllUnpaidEntries / payAllUnpaidEntriesForCurrentMonth ----------

    @Test
    @DisplayName("payAllUnpaidEntries delegates to the work entry repository with the employee id")
    void payAllUnpaidEntries_delegatesToRepository() {
        UserEntity worker = employee(2L, gardener(1L));
        when(workEntryRepository.payAllUnpaidEntries(2L)).thenReturn(4);

        int result = service.payAllUnpaidEntries(worker);

        assertThat(result).isEqualTo(4);
        verify(workEntryRepository).payAllUnpaidEntries(2L);
    }

    @Test
    @DisplayName("payAllUnpaidEntriesForCurrentMonth delegates to the work entry repository with the employee id")
    void payAllUnpaidEntriesForCurrentMonth_delegatesToRepository() {
        UserEntity worker = employee(2L, gardener(1L));
        when(workEntryRepository.payAllUnpaidEntriesForCurrentMonth(2L)).thenReturn(2);

        int result = service.payAllUnpaidEntriesForCurrentMonth(worker);

        assertThat(result).isEqualTo(2);
        verify(workEntryRepository).payAllUnpaidEntriesForCurrentMonth(2L);
    }

    // --- calculateSectorLaborCosts -----------------------------------------

    @Test
    @DisplayName("calculateSectorLaborCosts returns null when there are no entries for the period")
    void calculateSectorLaborCosts_whenNoEntries_returnsNull() {
        when(workEntryRepository.findAllExpensesByGivenDate(2026, 6, 10L, 2L)).thenReturn(List.of());

        SectorLaborCostDto result = service.calculateSectorLaborCosts(10L, 2L, 2026, 6);

        assertThat(result).isNull();
    }

    @Test
    @DisplayName("calculateSectorLaborCosts aggregates total, paid and unpaid costs and counts per sector")
    void calculateSectorLaborCosts_whenEntriesExist_aggregatesCostsAndCounts() {
        SectorEntity sector = new SectorEntity();
        sector.setSectorId(10L);
        sector.setDescription("Sektor A");
        when(sectorService.findById(10L)).thenReturn(Optional.of(sector));
        when(workEntryRepository.findAllExpensesByGivenDate(2026, 6, 10L, 2L)).thenReturn(List.of(
                entryWithSalary(new BigDecimal("100.00"), true),
                entryWithSalary(new BigDecimal("50.00"), false),
                entryWithSalary(new BigDecimal("25.00"), false)
        ));

        SectorLaborCostDto result = service.calculateSectorLaborCosts(10L, 2L, 2026, 6);

        assertThat(result.getSectorName()).isEqualTo("Sektor A");
        assertThat(result.getSectorLaborCost()).isEqualByComparingTo("175.00");
        assertThat(result.getPaidLaborCost()).isEqualByComparingTo("100.00");
        assertThat(result.getUnpaidLaborCost()).isEqualByComparingTo("75.00");
        assertThat(result.getTotalEntries()).isEqualTo(3);
        assertThat(result.getPaidEntries()).isEqualTo(1);
        assertThat(result.getUnpaidEntries()).isEqualTo(2);
    }

    @Test
    @DisplayName("calculateSectorLaborCosts uses the default sector name and zero paid cost when no sector id is given")
    void calculateSectorLaborCosts_whenNoSectorId_usesDefaultNameAndZeroPaidCost() {
        when(workEntryRepository.findAllExpensesByGivenDate(2026, 6, null, null)).thenReturn(List.of(
                entryWithSalary(new BigDecimal("40.00"), false),
                entryWithSalary(new BigDecimal("60.00"), false)
        ));

        SectorLaborCostDto result = service.calculateSectorLaborCosts(null, null, 2026, 6);

        assertThat(result.getSectorName()).isEqualTo("Wszystkie sektory");
        assertThat(result.getSectorLaborCost()).isEqualByComparingTo("100.00");
        assertThat(result.getPaidLaborCost()).isEqualByComparingTo("0");
        assertThat(result.getUnpaidLaborCost()).isEqualByComparingTo("100.00");
        assertThat(result.getPaidEntries()).isZero();
        assertThat(result.getUnpaidEntries()).isEqualTo(2);
        verifyNoInteractions(sectorService);
    }

    // --- getUnpaidEntriesByUserId ------------------------------------------

    @Test
    @DisplayName("getUnpaidEntriesByUserId maps every unpaid entry returned by the repository")
    void getUnpaidEntriesByUserId_mapsAllEntries() {
        UserEntity worker = employee(2L, gardener(1L));
        WorkEntryEntity e1 = new WorkEntryEntity();
        e1.setEntryId(11L);
        e1.setUser(worker);
        e1.setWorkDate(LocalDate.of(2026, 6, 1));
        e1.setDaySalary(new BigDecimal("100.00"));
        e1.setIsPaid(false);
        WorkEntryEntity e2 = new WorkEntryEntity();
        e2.setEntryId(12L);
        e2.setUser(worker);
        e2.setWorkDate(LocalDate.of(2026, 6, 2));
        e2.setDaySalary(new BigDecimal("80.00"));
        e2.setIsPaid(false);
        when(workEntryRepository.getUnpaidEntriesByUserId(2L)).thenReturn(List.of(e1, e2));

        List<WorkEntryDto> result = service.getUnpaidEntriesByUserId(2L);

        assertThat(result).hasSize(2)
                .extracting(WorkEntryDto::getEntryId)
                .containsExactly(11L, 12L);
    }

    @Test
    @DisplayName("getUnpaidEntriesByUserId returns an empty list when there are no unpaid entries")
    void getUnpaidEntriesByUserId_whenNoEntries_returnsEmptyList() {
        when(workEntryRepository.getUnpaidEntriesByUserId(2L)).thenReturn(List.of());

        List<WorkEntryDto> result = service.getUnpaidEntriesByUserId(2L);

        assertThat(result).isEmpty();
    }

    // --- saveAdvance -------------------------------------------------------

    @Test
    @DisplayName("saveAdvance delegates to the work entry repository with all advance details")
    void saveAdvance_delegatesToRepository() {
        UserEntity worker = employee(2L, gardener(1L));
        LocalDate date = LocalDate.of(2026, 6, 13);

        service.saveAdvance(worker, new BigDecimal("250.00"), "Zaliczka", date);

        verify(workEntryRepository).saveAdvance(worker, new BigDecimal("250.00"), "Zaliczka", date);
    }

    // --- getUnsettledAdvancesByUserId --------------------------------------

    @Test
    @DisplayName("getUnsettledAdvancesByUserId delegates to the work entry repository")
    void getUnsettledAdvancesByUserId_delegatesToRepository() {
        AdvancePayDto advance = new AdvancePayDto(1L, 2L, new BigDecimal("100.00"), "Zaliczka",
                LocalDate.of(2026, 6, 13), false);
        when(workEntryRepository.getUnsettledAdvancesByUserId(2L)).thenReturn(List.of(advance));

        List<AdvancePayDto> result = service.getUnsettledAdvancesByUserId(2L);

        assertThat(result).containsExactly(advance);
        verify(workEntryRepository).getUnsettledAdvancesByUserId(2L);
    }

    // --- getSumUnsettledAdvancesByUserId -----------------------------------

    @Test
    @DisplayName("getSumUnsettledAdvancesByUserId sums the advance amounts ignoring null amounts")
    void getSumUnsettledAdvancesByUserId_sumsAmountsIgnoringNulls() {
        AdvancePayDto a1 = new AdvancePayDto(1L, 2L, new BigDecimal("100.00"), "a", LocalDate.now(), false);
        AdvancePayDto a2 = new AdvancePayDto(2L, 2L, new BigDecimal("49.50"), "b", LocalDate.now(), false);
        AdvancePayDto a3 = new AdvancePayDto(3L, 2L, null, "c", LocalDate.now(), false);
        when(workEntryRepository.getUnsettledAdvancesByGardenerId(2L)).thenReturn(List.of(a1, a2, a3));

        AdvancePaySumDto result = service.getSumUnsettledAdvancesByUserId(2L);

        assertThat(result.getAmount()).isEqualByComparingTo("149.50");
    }

    @Test
    @DisplayName("getSumUnsettledAdvancesByUserId returns zero when there are no unsettled advances")
    void getSumUnsettledAdvancesByUserId_whenNoAdvances_returnsZero() {
        when(workEntryRepository.getUnsettledAdvancesByGardenerId(2L)).thenReturn(List.of());

        AdvancePaySumDto result = service.getSumUnsettledAdvancesByUserId(2L);

        assertThat(result.getAmount()).isEqualByComparingTo("0");
    }

    // --- payOffAllUnsettledAdvancePays -------------------------------------

    @Test
    @DisplayName("payOffAllUnsettledAdvancePays settles the advances through the advance pay repository")
    void payOffAllUnsettledAdvancePays_delegatesToAdvancePayRepository() {
        service.payOffAllUnsettledAdvancePays(2L);

        verify(advancePayRepository).settleAdvancePayEntries(2L);
        verifyNoInteractions(workEntryRepository);
    }
}
