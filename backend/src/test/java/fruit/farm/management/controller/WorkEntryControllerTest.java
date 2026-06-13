package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.entity.WorkEntryEntity;
import fruit.farm.management.entity.WorkType;
import fruit.farm.management.exception.ExceededWorkHoursException;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.dto.WorkEntryDto;
import fruit.farm.management.repository.WorkEntryRepository;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.UserService;
import fruit.farm.management.service.WorkScheduleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WorkEntryController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("WorkEntryController")
class WorkEntryControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    WorkEntryRepository workEntryRepository;
    @MockitoBean
    WorkScheduleService workScheduleService;
    @MockitoBean
    UserService userService;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    PasswordEncoder passwordEncoder;
    @MockitoBean
    fruit.farm.management.repository.UserRepository userRepository;

    // ---------------------------------------------------------------------
    // Authorization: /api/work-entries/** falls under anyRequest().authenticated()
    // so any authenticated authority is allowed; anonymous is denied with 403.
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/work-entries/week without authentication is denied (403)")
    void getWorkEntriesForWeek_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/work-entries/week")
                        .param("startDate", "2026-06-01")
                        .param("endDate", "2026-06-07"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/work-entries/week as any authenticated authority is allowed (200)")
    void getWorkEntriesForWeek_withAuthenticatedNonGardener_returns200() throws Exception {
        // Arrange
        UserDto gardener = new UserDto();
        gardener.setId(7L);
        gardener.setNickname("user");
        when(userService.findUserByNickname("user")).thenReturn(Optional.of(gardener));
        when(workEntryRepository.findByUserGardenerIdAndWorkDateBetween(
                eq(7L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        // Act & Assert
        mvc.perform(get("/api/work-entries/week")
                        .param("startDate", "2026-06-01")
                        .param("endDate", "2026-06-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(authorities = "Gardener", username = "gardener")
    @DisplayName("GET /api/work-entries/week returns mapped entries for the logged gardener (200)")
    void getWorkEntriesForWeek_withEntriesForGardener_returnsMappedDtos() throws Exception {
        // Arrange
        UserDto gardener = new UserDto();
        gardener.setId(42L);
        gardener.setNickname("gardener");
        when(userService.findUserByNickname("gardener")).thenReturn(Optional.of(gardener));

        WorkEntryEntity entry = newEntry(100L, 5, WorkType.HARVEST);
        when(workEntryRepository.findByUserGardenerIdAndWorkDateBetween(
                eq(42L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(entry));

        // Act & Assert
        mvc.perform(get("/api/work-entries/week")
                        .param("startDate", "2026-06-01")
                        .param("endDate", "2026-06-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].entryId").value(100))
                .andExpect(jsonPath("$[0].duration").value(5))
                .andExpect(jsonPath("$[0].workType").value("HARVEST"));
    }

    @Test
    @WithMockUser(authorities = "Gardener", username = "ghost")
    @DisplayName("GET /api/work-entries/week returns 500 when the logged user is not found")
    void getWorkEntriesForWeek_whenLoggedUserMissing_returns500() throws Exception {
        // The controller wraps the missing-user RuntimeException into a 500 response.
        when(userService.findUserByNickname("ghost")).thenReturn(Optional.empty());

        mvc.perform(get("/api/work-entries/week")
                        .param("startDate", "2026-06-01")
                        .param("endDate", "2026-06-07"))
                .andExpect(status().isInternalServerError());
    }

    // ---------------------------------------------------------------------
    // GET /api/work-entries/user/{userId}/unpaid
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/work-entries/user/{userId}/unpaid without authentication is denied (403)")
    void getUnpaidEntriesByUserId_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/work-entries/user/1/unpaid"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-entries/user/{userId}/unpaid returns the unpaid entries (200)")
    void getUnpaidEntriesByUserId_whenAuthenticated_returnsEntries() throws Exception {
        // Arrange
        WorkEntryDto dto = WorkEntryDto.builder().entryId(9L).duration(3).isPaid(false).build();
        when(workScheduleService.getUnpaidEntriesByUserId(1L)).thenReturn(List.of(dto));

        // Act & Assert
        mvc.perform(get("/api/work-entries/user/1/unpaid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].entryId").value(9))
                .andExpect(jsonPath("$[0].isPaid").value(false));
    }

    // ---------------------------------------------------------------------
    // GET /api/work-entries/{id}
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/work-entries/{id} without authentication is denied (403)")
    void getWorkEntryById_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/work-entries/5"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-entries/{id} returns the entry when it exists (200)")
    void getWorkEntryById_whenEntryExists_returns200() throws Exception {
        // Arrange
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(newEntry(5L, 8, WorkType.WEEDING)));

        // Act & Assert
        mvc.perform(get("/api/work-entries/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entryId").value(5))
                .andExpect(jsonPath("$.workType").value("WEEDING"));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/work-entries/{id} returns 404 when the entry does not exist")
    void getWorkEntryById_whenEntryMissing_returns404() throws Exception {
        // Arrange
        when(workEntryRepository.findById(404L)).thenReturn(Optional.empty());

        // Act & Assert
        mvc.perform(get("/api/work-entries/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Work entry not found with ID: 404"));
    }

    // ---------------------------------------------------------------------
    // POST /api/work-entries
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/work-entries without authentication is denied (403)")
    void createWorkEntries_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(post("/api/work-entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener", username = "gardener")
    @DisplayName("POST /api/work-entries creates entries and returns the saved count (200)")
    void createWorkEntries_withValidBody_returns200WithCount() throws Exception {
        // Arrange
        UserEntity gardener = userWithActive(true);
        gardener.setId(42L);
        when(userService.findUserEntityByNickname("gardener")).thenReturn(Optional.of(gardener));

        WorkEntryEntity saved = newEntry(1L, 4, WorkType.HARVEST);
        when(workScheduleService.createWorkSchedule(any(), eq(gardener))).thenReturn(List.of(saved));

        WorkEntryDto request = WorkEntryDto.builder()
                .workDate(LocalDate.of(2026, 6, 1))
                .duration(4)
                .workType(WorkType.HARVEST)
                .build();

        // Act & Assert
        mvc.perform(post("/api/work-entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Work entries created successfully"))
                .andExpect(jsonPath("$.count").value(1));
    }

    @Test
    @WithMockUser(authorities = "Gardener", username = "gardener")
    @DisplayName("POST /api/work-entries returns 400 when the work-hours limit is exceeded")
    void createWorkEntries_whenWorkHoursExceeded_returns400() throws Exception {
        // Arrange
        UserEntity gardener = userWithActive(true);
        gardener.setId(42L);
        when(userService.findUserEntityByNickname("gardener")).thenReturn(Optional.of(gardener));
        when(workScheduleService.createWorkSchedule(any(), eq(gardener)))
                .thenThrow(new ExceededWorkHoursException("You can not work more than 18 hours per given day."));

        WorkEntryDto request = WorkEntryDto.builder()
                .workDate(LocalDate.of(2026, 6, 1))
                .duration(20)
                .workType(WorkType.HARVEST)
                .build();

        // Act & Assert
        mvc.perform(post("/api/work-entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("Błąd w rejestracji pracy: You can not work more than 18 hours per given day."));
    }

    // ---------------------------------------------------------------------
    // PUT /api/work-entries/{id}
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PUT /api/work-entries/{id} without authentication is denied (403)")
    void updateWorkEntry_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(put("/api/work-entries/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/work-entries/{id} updates an existing entry and returns it (200)")
    void updateWorkEntry_whenEntryExists_returns200() throws Exception {
        // Arrange
        WorkEntryEntity existing = newEntry(5L, 8, WorkType.WEEDING);
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(workScheduleService.updateWorkEntry(any(WorkEntryDto.class), any()))
                .thenReturn(newEntry(5L, 6, WorkType.PRUNING));

        WorkEntryDto request = WorkEntryDto.builder().duration(6).workType(WorkType.PRUNING).build();

        // Act & Assert
        mvc.perform(put("/api/work-entries/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Work entry updated successfully"))
                .andExpect(jsonPath("$.entry.workType").value("PRUNING"));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PUT /api/work-entries/{id} returns 404 when the entry does not exist")
    void updateWorkEntry_whenEntryMissing_returns404() throws Exception {
        // Arrange
        when(workEntryRepository.findById(404L)).thenReturn(Optional.empty());

        WorkEntryDto request = WorkEntryDto.builder().duration(6).build();

        // Act & Assert
        mvc.perform(put("/api/work-entries/404")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Work entry not found with ID: 404"));
    }

    // ---------------------------------------------------------------------
    // PATCH /api/work-entries/{id}/approval
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /api/work-entries/{id}/approval without authentication is denied (403)")
    void toggleApproval_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/work-entries/5/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isApproved\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/{id}/approval toggles approval and saves the entry (200)")
    void toggleApproval_withValidBody_returns200AndSaves() throws Exception {
        // Arrange
        WorkEntryEntity entry = newEntry(5L, 8, WorkType.HARVEST);
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(entry));

        // Act & Assert
        mvc.perform(patch("/api/work-entries/5/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isApproved", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("approved"))
                .andExpect(jsonPath("$.isApproved").value("true"));

        verify(workEntryRepository).save(entry);
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/{id}/approval returns 400 when the isApproved field is missing")
    void toggleApproval_whenIsApprovedMissing_returns400() throws Exception {
        // Arrange
        WorkEntryEntity entry = newEntry(5L, 8, WorkType.HARVEST);
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(entry));

        // Act & Assert
        mvc.perform(patch("/api/work-entries/5/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing 'isApproved' field in request"));

        verify(workEntryRepository, never()).save(any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/{id}/approval returns 404 when the entry does not exist")
    void toggleApproval_whenEntryMissing_returns404() throws Exception {
        // Arrange
        when(workEntryRepository.findById(404L)).thenReturn(Optional.empty());

        // Act & Assert
        mvc.perform(patch("/api/work-entries/404/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isApproved\":true}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Work entry not found with ID: 404"));
    }

    // ---------------------------------------------------------------------
    // DELETE /api/work-entries/{id}
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /api/work-entries/{id} without authentication is denied (403)")
    void deleteWorkEntry_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(delete("/api/work-entries/5"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/work-entries/{id} deletes an existing entry (200)")
    void deleteWorkEntry_whenEntryExists_returns200AndDeletes() throws Exception {
        // Arrange
        WorkEntryEntity entry = newEntry(5L, 8, WorkType.HARVEST);
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(entry));

        // Act & Assert
        mvc.perform(delete("/api/work-entries/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Work entry deleted successfully"))
                .andExpect(jsonPath("$.id").value("5"));

        verify(workEntryRepository).delete(entry);
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("DELETE /api/work-entries/{id} returns 404 when the entry does not exist")
    void deleteWorkEntry_whenEntryMissing_returns404() throws Exception {
        // Arrange
        when(workEntryRepository.findById(404L)).thenReturn(Optional.empty());

        // Act & Assert
        mvc.perform(delete("/api/work-entries/404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Work entry not found with ID: 404"));

        verify(workEntryRepository, never()).delete(any());
    }

    // ---------------------------------------------------------------------
    // PATCH /api/work-entries/{id}/paid
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /api/work-entries/{id}/paid without authentication is denied (403)")
    void togglePaid_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/work-entries/5/paid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isPaid\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/{id}/paid toggles paid status and saves the entry (200)")
    void togglePaid_withValidBody_returns200AndSaves() throws Exception {
        // Arrange
        WorkEntryEntity entry = newEntry(5L, 8, WorkType.HARVEST);
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(entry));

        // Act & Assert
        mvc.perform(patch("/api/work-entries/5/paid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isPaid", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action").value("unpaid"))
                .andExpect(jsonPath("$.isPaid").value("false"));

        verify(workEntryRepository).save(entry);
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/{id}/paid returns 400 when the isPaid field is missing")
    void togglePaid_whenIsPaidMissing_returns400() throws Exception {
        // Arrange
        WorkEntryEntity entry = newEntry(5L, 8, WorkType.HARVEST);
        when(workEntryRepository.findById(5L)).thenReturn(Optional.of(entry));

        // Act & Assert
        mvc.perform(patch("/api/work-entries/5/paid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Missing 'isPaid' field in request"));

        verify(workEntryRepository, never()).save(any());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/{id}/paid returns 404 when the entry does not exist")
    void togglePaid_whenEntryMissing_returns404() throws Exception {
        // Arrange
        when(workEntryRepository.findById(404L)).thenReturn(Optional.empty());

        // Act & Assert
        mvc.perform(patch("/api/work-entries/404/paid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isPaid\":true}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Work entry not found with ID: 404"));
    }

    // ---------------------------------------------------------------------
    // PATCH /api/work-entries/user/{userId}/pay-all-and-settle
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /api/work-entries/user/{userId}/pay-all-and-settle without authentication is denied (403)")
    void payAllUnpaidForUser_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/work-entries/user/1/pay-all-and-settle"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/user/{userId}/pay-all-and-settle settles all unpaid entries (200)")
    void payAllUnpaidForUser_whenEmployeeExists_returnsCount() throws Exception {
        // Arrange
        UserEntity employee = userWithActive(true);
        employee.setId(1L);
        when(userService.findUserEntityById(1L)).thenReturn(Optional.of(employee));
        when(workScheduleService.payAllUnpaidEntries(employee)).thenReturn(3);

        // Act & Assert
        mvc.perform(patch("/api/work-entries/user/1/pay-all-and-settle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3))
                .andExpect(jsonPath("$.userId").value("1"));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/user/{userId}/pay-all-and-settle returns 404 when the employee is missing")
    void payAllUnpaidForUser_whenEmployeeMissing_returns404() throws Exception {
        // The controller maps the not-found RuntimeException to a 404 response.
        when(userService.findUserEntityById(99L)).thenReturn(Optional.empty());

        mvc.perform(patch("/api/work-entries/user/99/pay-all-and-settle"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Employee not found with ID: 99"));

        verify(workScheduleService, never()).payAllUnpaidEntries(any());
    }

    // ---------------------------------------------------------------------
    // PATCH /api/work-entries/user/{userId}/pay-month-and-settle
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /api/work-entries/user/{userId}/pay-month-and-settle without authentication is denied (403)")
    void payAllUnpaidForUserMonth_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/work-entries/user/1/pay-month-and-settle"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/user/{userId}/pay-month-and-settle settles current-month entries (200)")
    void payAllUnpaidForUserMonth_whenEmployeeExists_returnsCount() throws Exception {
        // Arrange
        UserEntity employee = userWithActive(true);
        employee.setId(1L);
        when(userService.findUserEntityById(1L)).thenReturn(Optional.of(employee));
        when(workScheduleService.payAllUnpaidEntriesForCurrentMonth(employee)).thenReturn(2);

        // Act & Assert
        mvc.perform(patch("/api/work-entries/user/1/pay-month-and-settle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.userId").value("1"));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/work-entries/user/{userId}/pay-month-and-settle returns 404 when the employee is missing")
    void payAllUnpaidForUserMonth_whenEmployeeMissing_returns404() throws Exception {
        // The controller maps the not-found RuntimeException to a 404 response.
        when(userService.findUserEntityById(99L)).thenReturn(Optional.empty());

        mvc.perform(patch("/api/work-entries/user/99/pay-month-and-settle"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Employee not found with ID: 99"));

        verify(workScheduleService, never()).payAllUnpaidEntriesForCurrentMonth(any());
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private WorkEntryEntity newEntry(Long id, int duration, WorkType workType) {
        WorkEntryEntity entry = new WorkEntryEntity();
        entry.setEntryId(id);
        entry.setWorkDate(LocalDate.of(2026, 6, 1));
        entry.setDuration(duration);
        entry.setWorkType(workType);
        entry.setDaySalary(new BigDecimal("123.45"));
        entry.setKilogramsPicked(0L);
        entry.setIsPaid(false);
        return entry;
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
