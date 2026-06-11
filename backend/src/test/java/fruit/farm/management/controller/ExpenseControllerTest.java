package fruit.farm.management.controller;

import fruit.farm.management.dto.UserDto;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.ExpenseService;
import fruit.farm.management.service.SectorService;
import fruit.farm.management.service.UserService;
import fruit.farm.management.service.WorkScheduleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExpenseController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("ExpenseController security")
class ExpenseControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    ExpenseService expenseService;
    @MockitoBean
    UserService userService;
    @MockitoBean
    SectorService sectorService;
    @MockitoBean
    WorkScheduleService workScheduleService;

    // Security collaborators required to build the filter chain
    @MockitoBean
    OrchardDetailsService orchardDetailsService;
    @MockitoBean
    JwtService jwtService;
    @MockitoBean
    PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("GET /api/expenses without authentication is denied (403)")
    void getExpenses_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(get("/api/expenses")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/expenses as a non-Gardener returns 403")
    void getExpenses_withEmployeeAuthority_returns403() throws Exception {
        mvc.perform(get("/api/expenses")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/expenses as a Gardener returns 200")
    void getExpenses_withGardenerAuthority_returns200() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(1L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(expenseService.getAllPaginatedExpensesByGardener(any(), any(), any(), any(), any()))
                .thenReturn(Page.empty());

        mvc.perform(get("/api/expenses")).andExpect(status().isOk());
    }
}
