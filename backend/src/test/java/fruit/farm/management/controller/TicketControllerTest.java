package fruit.farm.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.dto.TicketStatsDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.security.CorsConfig;
import fruit.farm.management.security.JwtAuthenticationFilter;
import fruit.farm.management.security.JwtService;
import fruit.farm.management.security.OrchardDetailsService;
import fruit.farm.management.security.SecurityConfig;
import fruit.farm.management.service.TicketService;
import fruit.farm.management.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TicketController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class})
@DisplayName("TicketController security and endpoints")
class TicketControllerTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    TicketService ticketService;
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
    // POST /api/tickets  (reportTicket)  ->  authenticated() : any logged user
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/tickets without authentication is denied (403)")
    void reportTicket_withoutAuthentication_isDenied() throws Exception {
        // Stateless JWT setup has no 401 entry point, so anonymous access is rejected with 403.
        mvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validTicketDto())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("POST /api/tickets with a valid body as any authenticated user returns 201")
    void reportTicket_withValidBodyAsAuthenticatedUser_returns201() throws Exception {
        // Arrange
        UserDto logged = new UserDto();
        logged.setId(7L);
        when(userService.getLoggedUser()).thenReturn(logged);
        TicketDto created = TicketDto.builder().id(99L).description("Zepsuty traktor w sadzie").build();
        when(ticketService.reportTicket(any(), any())).thenReturn(created);

        // Act + Assert
        mvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validTicketDto())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.description").value("Zepsuty traktor w sadzie"));

        // The controller must pass the resolved logged user to the service, not the request body.
        verify(ticketService).reportTicket(any(), eq(logged));
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/tickets with a blank description returns 400")
    void reportTicket_withBlankDescription_returns400() throws Exception {
        // description is @NotBlank, so an empty value must fail bean validation
        TicketDto invalid = TicketDto.builder().description("").build();

        mvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("POST /api/tickets with a too-short description returns 400")
    void reportTicket_withTooShortDescription_returns400() throws Exception {
        // description has @Size(min = 5); four characters violates the lower boundary
        TicketDto invalid = TicketDto.builder().description("1234").build();

        mvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------------
    // GET /api/tickets  (getMyTickets)  ->  authenticated() : any logged user
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/tickets without authentication is denied (403)")
    void getMyTickets_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/tickets")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/tickets as any authenticated user returns 200")
    void getMyTickets_withAuthenticatedUser_returns200() throws Exception {
        UserDto logged = new UserDto();
        logged.setId(3L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(ticketService.getTicketsByUser(3L)).thenReturn(List.of());

        mvc.perform(get("/api/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        // The controller must resolve the logged user's id and query the service with it.
        verify(ticketService).getTicketsByUser(3L);
    }

    // ---------------------------------------------------------------------
    // GET /api/tickets/all  (getAllTickets)  ->  hasAuthority("Admin")
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/tickets/all without authentication is denied (403)")
    void getAllTickets_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/tickets/all")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("GET /api/tickets/all as a non-Admin returns 403")
    void getAllTickets_withNonAdminAuthority_returns403() throws Exception {
        mvc.perform(get("/api/tickets/all")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("GET /api/tickets/all as an Admin returns 200")
    void getAllTickets_withAdminAuthority_returns200() throws Exception {
        when(ticketService.getAllTickets(any(), any(), any())).thenReturn(Page.empty());

        mvc.perform(get("/api/tickets/all")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("GET /api/tickets/all with status and search filters as an Admin forwards both to the service and returns 200")
    void getAllTickets_withStatusAndSearchFilterAsAdmin_returns200() throws Exception {
        when(ticketService.getAllTickets(eq(TicketStatus.OPEN), eq("traktor"), any())).thenReturn(Page.empty());

        mvc.perform(get("/api/tickets/all").param("status", "OPEN").param("search", "traktor"))
                .andExpect(status().isOk());

        // The controller must bind the status enum and the raw search string and forward both unchanged.
        verify(ticketService).getAllTickets(eq(TicketStatus.OPEN), eq("traktor"), any());
    }

    // ---------------------------------------------------------------------
    // GET /api/tickets/stats  (getStats)  ->  hasAuthority("Admin")
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/tickets/stats without authentication is denied (403)")
    void getStats_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(get("/api/tickets/stats")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("GET /api/tickets/stats as a non-Admin returns 403")
    void getStats_withNonAdminAuthority_returns403() throws Exception {
        mvc.perform(get("/api/tickets/stats")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("GET /api/tickets/stats as an Admin returns 200 with the computed counts")
    void getStats_withAdminAuthority_returns200() throws Exception {
        TicketStatsDto stats = TicketStatsDto.builder().total(10).open(4).inProgress(3).closed(3).build();
        when(ticketService.getStats()).thenReturn(stats);

        mvc.perform(get("/api/tickets/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(10))
                .andExpect(jsonPath("$.open").value(4))
                .andExpect(jsonPath("$.inProgress").value(3))
                .andExpect(jsonPath("$.closed").value(3));
    }

    // ---------------------------------------------------------------------
    // PATCH /api/tickets/{id}/status  (updateStatus)  ->  hasAuthority("Admin")
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /api/tickets/{id}/status without authentication is denied (403)")
    void updateStatus_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Gardener")
    @DisplayName("PATCH /api/tickets/{id}/status as a non-Admin returns 403")
    void updateStatus_withNonAdminAuthority_returns403() throws Exception {
        mvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("PATCH /api/tickets/{id}/status with a valid status as an Admin returns 200")
    void updateStatus_withValidStatusAsAdmin_returns200() throws Exception {
        TicketDto updated = TicketDto.builder().id(1L).status(TicketStatus.CLOSED).build();
        when(ticketService.updateStatus(eq(1L), eq(TicketStatus.CLOSED))).thenReturn(updated);

        mvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("PATCH /api/tickets/{id}/status with a null status returns 400")
    void updateStatus_withNullStatus_returns400() throws Exception {
        // StatusUpdateRequest.status is @NotNull, so an empty body must fail validation
        mvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------------
    // PATCH /api/tickets/{id}/comment  (updateComment)  ->  hasAuthority("Admin")
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /api/tickets/{id}/comment without authentication is denied (403)")
    void updateComment_withoutAuthentication_isDenied() throws Exception {
        mvc.perform(patch("/api/tickets/1/comment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Naprawione\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Employee")
    @DisplayName("PATCH /api/tickets/{id}/comment as a non-Admin returns 403")
    void updateComment_withNonAdminAuthority_returns403() throws Exception {
        mvc.perform(patch("/api/tickets/1/comment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Naprawione\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("PATCH /api/tickets/{id}/comment with a valid comment as an Admin returns 200")
    void updateComment_withValidCommentAsAdmin_returns200() throws Exception {
        TicketDto updated = TicketDto.builder().id(1L).adminComment("Naprawione").build();
        when(ticketService.updateComment(eq(1L), eq("Naprawione"))).thenReturn(updated);

        mvc.perform(patch("/api/tickets/1/comment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Naprawione\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminComment").value("Naprawione"));
    }

    @Test
    @WithMockUser(authorities = "Admin")
    @DisplayName("PATCH /api/tickets/{id}/comment with an over-length comment returns 400")
    void updateComment_withOverLengthComment_returns400() throws Exception {
        // CommentUpdateRequest.comment is @Size(max = 2000); 2001 characters breaks the upper boundary
        String tooLong = "a".repeat(2001);
        String body = "{\"comment\":\"" + tooLong + "\"}";

        mvc.perform(patch("/api/tickets/1/comment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------------
    // JWT cookie based authentication through the real filter chain
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("a blocked user with a valid token is denied (403)")
    void getMyTickets_withValidTokenButBlockedUser_isDenied() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("blocked");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findActiveByNickname("blocked")).thenReturn(Optional.of(false));

        mvc.perform(get("/api/tickets").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an active user authenticated via token reaches the endpoint (200)")
    void getMyTickets_withValidTokenAndActiveUser_returns200() throws Exception {
        when(jwtService.validateToken("token")).thenReturn(true);
        when(jwtService.getNicknameFromToken("token")).thenReturn("active");
        when(jwtService.getRolesFromToken("token")).thenReturn(List.of("Gardener"));
        when(userRepository.findActiveByNickname("active")).thenReturn(Optional.of(true));

        UserDto logged = new UserDto();
        logged.setId(5L);
        when(userService.getLoggedUser()).thenReturn(logged);
        when(ticketService.getTicketsByUser(5L)).thenReturn(List.of());

        mvc.perform(get("/api/tickets").cookie(new Cookie("accessToken", "token")))
                .andExpect(status().isOk());
    }

    private TicketDto validTicketDto() {
        return TicketDto.builder()
                .description("Zepsuty traktor w sadzie")
                .category("Sprzęt")
                .build();
    }

    private UserEntity userWithActive(boolean active) {
        UserEntity user = new UserEntity();
        user.setNickname("user");
        user.setActive(active);
        user.setRole(new RoleEntity(2L, "Gardener"));
        return user;
    }
}
