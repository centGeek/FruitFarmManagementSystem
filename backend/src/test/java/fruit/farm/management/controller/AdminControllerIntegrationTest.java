package fruit.farm.management.controller;

import fruit.farm.management.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("AdminController (integration)")
class AdminControllerIntegrationTest extends AbstractIntegrationTest {

    private static final long ADMIN_ID = 1L;
    private static final long GARDENER_ID = 2L;

    @Autowired
    MockMvc mockMvc;

    @Test
    @DisplayName("rejects unauthenticated access to the admin API with 403")
    void getAllUsers_unauthenticated_isForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "gardener", authorities = "Gardener")
    @DisplayName("rejects a non-admin authority with 403")
    void getAllUsers_asGardener_isForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("returns only gardeners for an admin, excluding other roles")
    void getAllUsers_asAdmin_returnsOnlyGardeners() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[?(@.nickname == 'gardener')].roleName").value(org.hamcrest.Matchers.hasItem("Gardener")))
                .andExpect(jsonPath("$[*].roleName").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("Gardener"))));
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("returns global statistics for an admin")
    void getStats_asAdmin_returnsAggregates() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalUsers").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.admins").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalExpenses").exists())
                .andExpect(jsonPath("$.netBalance").exists())
                .andExpect(jsonPath("$.ticketsByMonth").isArray());
    }

    @Test
    @DisplayName("rejects unauthenticated access to statistics with 403")
    void getStats_unauthenticated_isForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("lists the seeded roles")
    void getAllRoles_asAdmin_returnsSeededRoles() throws Exception {
        mockMvc.perform(get("/api/admin/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(org.hamcrest.Matchers.hasItems("Admin", "Gardener", "Employee")));
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("blocks another user's account")
    void setActive_blocksGardener() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/status", GARDENER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value((int) GARDENER_ID))
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("refuses to change the admin's own status with 400")
    void setActive_onSelf_isBadRequest() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/status", ADMIN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("no longer exposes a role-change endpoint, so a gardener stays a gardener")
    void changeRole_endpointRemoved_isNotFound() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/role", GARDENER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roleName\": \"Employee\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("resets another user's password")
    void resetPassword_returnsConfirmation() throws Exception {
        mockMvc.perform(post("/api/admin/users/{id}/reset-password", GARDENER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\": \"newpass123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(username = "admin", authorities = "Admin")
    @DisplayName("returns 404 when changing status of a missing user")
    void setActive_missingUser_isNotFound() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/status", 9999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isNotFound());
    }
}
