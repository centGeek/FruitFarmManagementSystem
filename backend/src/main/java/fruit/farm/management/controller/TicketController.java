package fruit.farm.management.controller;

import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.dto.TicketStatsDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.service.TicketService;
import fruit.farm.management.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@AllArgsConstructor
@Slf4j
public class TicketController {

    private TicketService ticketService;
    private UserService userService;

    @PostMapping
    public ResponseEntity<TicketDto> reportTicket(@Valid @RequestBody TicketDto ticketDto) {

        UserDto loggedUser = userService.getLoggedUser();
        log.info("User {} is reporting a new ticket", loggedUser.getId());

        TicketDto createdTicket = ticketService.reportTicket(ticketDto, loggedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
    }

    @GetMapping
    public ResponseEntity<List<TicketDto>> getMyTickets() {

        UserDto loggedUser = userService.getLoggedUser();
        log.info("Fetching tickets for user {}", loggedUser.getId());
        return ResponseEntity.ok(ticketService.getTicketsByUser(loggedUser.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<Page<TicketDto>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 12) Pageable pageable) {

        log.info("Admin is fetching tickets - status: {}, search: {}, page: {}", status, search, pageable);
        return ResponseEntity.ok(ticketService.getAllTickets(status, search, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<TicketStatsDto> getStats() {

        log.info("Admin is fetching ticket stats");
        return ResponseEntity.ok(ticketService.getStats());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketDto> updateStatus(@PathVariable Long id,
                                                  @Valid @RequestBody StatusUpdateRequest request) {

        log.info("Admin is changing status of ticket {} to {}", id, request.getStatus());
        return ResponseEntity.ok(ticketService.updateStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/comment")
    public ResponseEntity<TicketDto> updateComment(@PathVariable Long id,
                                                   @Valid @RequestBody CommentUpdateRequest request) {

        log.info("Admin is updating comment of ticket {}", id);
        return ResponseEntity.ok(ticketService.updateComment(id, request.getComment()));
    }

    @Data
    public static class StatusUpdateRequest {

        @NotNull(message = "Status jest wymagany")
        private TicketStatus status;
    }

    @Data
    public static class CommentUpdateRequest {

        @Size(max = 2000, message = "Komentarz może mieć maksymalnie 2000 znaków")
        private String comment;
    }
}
