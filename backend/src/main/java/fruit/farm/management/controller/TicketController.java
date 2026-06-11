package fruit.farm.management.controller;

import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.service.TicketService;
import fruit.farm.management.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
}
