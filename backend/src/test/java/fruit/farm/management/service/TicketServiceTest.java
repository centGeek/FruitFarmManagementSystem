package fruit.farm.management.service;

import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.dto.TicketStatsDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.repository.TicketRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketService")
class TicketServiceTest {

    @Mock
    TicketRepository ticketRepository;

    @Mock
    UserService userService;

    @InjectMocks
    TicketService service;

    @Captor
    ArgumentCaptor<TicketEntity> ticketCaptor;

    private UserEntity reporterEntity() {
        UserEntity user = new UserEntity();
        user.setId(3L);
        user.setNickname("reporter");
        user.setEmail("reporter@orch.com");
        return user;
    }

    private TicketDto incomingTicket() {
        return TicketDto.builder()
                .description("Broken irrigation valve")
                .category("INFRASTRUCTURE")
                .build();
    }

    private UserDto reporter() {
        UserDto dto = new UserDto();
        dto.setId(3L);
        return dto;
    }

    @Test
    @DisplayName("reportTicket opens a new ticket for an existing user")
    void reportTicket_whenUserExists_savesOpenTicket() {
        when(userService.findUserEntityById(3L)).thenReturn(Optional.of(reporterEntity()));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TicketDto result = service.reportTicket(incomingTicket(), reporter());

        verify(ticketRepository).save(ticketCaptor.capture());
        TicketEntity saved = ticketCaptor.getValue();
        assertThat(saved.getStatus()).isEqualTo(TicketStatus.OPEN);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUserEntity().getId()).isEqualTo(3L);
        assertThat(result.getStatus()).isEqualTo(TicketStatus.OPEN);
        assertThat(result.getDescription()).isEqualTo("Broken irrigation valve");
        assertThat(result.getUserDto()).isNotNull();
    }

    @Test
    @DisplayName("reportTicket throws NotFound when the reporter does not exist")
    void reportTicket_whenUserMissing_throwsNotFound() {
        when(userService.findUserEntityById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reportTicket(incomingTicket(), reporter()))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("3");
        verify(ticketRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateStatus to CLOSED sets the closedAt timestamp")
    void updateStatus_whenClosed_setsClosedAt() {
        TicketEntity ticket = new TicketEntity(1L, reporterEntity(), "desc", "CAT",
                LocalDateTime.now(), null, null, TicketStatus.OPEN);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        TicketDto result = service.updateStatus(1L, TicketStatus.CLOSED);

        assertThat(result.getStatus()).isEqualTo(TicketStatus.CLOSED);
        assertThat(ticket.getClosedAt()).isNotNull();
    }

    @Test
    @DisplayName("updateStatus to a non-closed status clears closedAt")
    void updateStatus_whenNotClosed_clearsClosedAt() {
        TicketEntity ticket = new TicketEntity(1L, reporterEntity(), "desc", "CAT",
                LocalDateTime.now(), LocalDateTime.now(), null, TicketStatus.CLOSED);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        TicketDto result = service.updateStatus(1L, TicketStatus.IN_PROGRESS);

        assertThat(result.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        assertThat(ticket.getClosedAt()).isNull();
    }

    @Test
    @DisplayName("updateStatus throws NotFound when the ticket does not exist")
    void updateStatus_whenNotFound_throwsNotFound() {
        when(ticketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateStatus(99L, TicketStatus.CLOSED))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("updateComment stores the admin comment on the ticket")
    void updateComment_storesComment() {
        TicketEntity ticket = new TicketEntity(1L, reporterEntity(), "desc", "CAT",
                LocalDateTime.now(), null, null, TicketStatus.OPEN);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        TicketDto result = service.updateComment(1L, "Rozwiązane — wymieniono czujnik");

        assertThat(result.getAdminComment()).isEqualTo("Rozwiązane — wymieniono czujnik");
        assertThat(ticket.getAdminComment()).isEqualTo("Rozwiązane — wymieniono czujnik");
    }

    @Test
    @DisplayName("updateComment clears the comment when given a blank value")
    void updateComment_blankClearsComment() {
        TicketEntity ticket = new TicketEntity(1L, reporterEntity(), "desc", "CAT",
                LocalDateTime.now(), null, "old", TicketStatus.OPEN);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);

        TicketDto result = service.updateComment(1L, "   ");

        assertThat(result.getAdminComment()).isNull();
        assertThat(ticket.getAdminComment()).isNull();
    }

    @Test
    @DisplayName("updateComment throws NotFound when the ticket does not exist")
    void updateComment_whenNotFound_throwsNotFound() {
        when(ticketRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateComment(99L, "x"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("99");
        verify(ticketRepository, never()).save(any());
    }

    @Test
    @DisplayName("getTicketsByUser maps every ticket returned by the repository")
    void getTicketsByUser_mapsAll() {
        TicketEntity t1 = new TicketEntity(1L, reporterEntity(), "a", "CAT",
                LocalDateTime.now(), null, null, TicketStatus.OPEN);
        TicketEntity t2 = new TicketEntity(2L, reporterEntity(), "b", "CAT",
                LocalDateTime.now(), null, null, TicketStatus.CLOSED);
        when(ticketRepository.findByUserIdOrderByCreatedAtDesc(3L)).thenReturn(List.of(t1, t2));

        List<TicketDto> result = service.getTicketsByUser(3L);

        assertThat(result).hasSize(2)
                .extracting(TicketDto::getStatus)
                .containsExactly(TicketStatus.OPEN, TicketStatus.CLOSED);
    }

    @Test
    @DisplayName("getAllTickets maps the paginated entities returned by the repository")
    void getAllTickets_mapsPage() {
        Pageable pageable = PageRequest.of(0, 12);
        TicketEntity t1 = new TicketEntity(1L, reporterEntity(), "a", "CAT",
                LocalDateTime.now(), null, null, TicketStatus.OPEN);
        TicketEntity t2 = new TicketEntity(2L, reporterEntity(), "b", "CAT",
                LocalDateTime.now(), null, null, TicketStatus.CLOSED);
        Page<TicketEntity> page = new PageImpl<>(List.of(t1, t2), pageable, 2);
        when(ticketRepository.findAllFiltered(null, null, pageable)).thenReturn(page);

        Page<TicketDto> result = service.getAllTickets(null, null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent())
                .extracting(TicketDto::getStatus)
                .containsExactly(TicketStatus.OPEN, TicketStatus.CLOSED);
    }

    @Test
    @DisplayName("getAllTickets normalizes a blank search term to null")
    void getAllTickets_blankSearchBecomesNull() {
        Pageable pageable = PageRequest.of(0, 12);
        when(ticketRepository.findAllFiltered(eq(TicketStatus.OPEN), isNull(), eq(pageable)))
                .thenReturn(Page.empty(pageable));

        service.getAllTickets(TicketStatus.OPEN, "   ", pageable);

        verify(ticketRepository).findAllFiltered(TicketStatus.OPEN, null, pageable);
    }

    @Test
    @DisplayName("getAllTickets trims a non-blank search term before querying")
    void getAllTickets_trimsSearch() {
        Pageable pageable = PageRequest.of(0, 12);
        when(ticketRepository.findAllFiltered(isNull(), eq("valve"), eq(pageable)))
                .thenReturn(Page.empty(pageable));

        service.getAllTickets(null, "  valve  ", pageable);

        verify(ticketRepository).findAllFiltered(null, "valve", pageable);
    }

    @Test
    @DisplayName("getStats aggregates the total and per-status counts")
    void getStats_aggregatesCounts() {
        when(ticketRepository.count()).thenReturn(10L);
        when(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(4L);
        when(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(3L);
        when(ticketRepository.countByStatus(TicketStatus.CLOSED)).thenReturn(3L);

        TicketStatsDto stats = service.getStats();

        assertThat(stats.getTotal()).isEqualTo(10L);
        assertThat(stats.getOpen()).isEqualTo(4L);
        assertThat(stats.getInProgress()).isEqualTo(3L);
        assertThat(stats.getClosed()).isEqualTo(3L);
    }
}
