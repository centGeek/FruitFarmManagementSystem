package fruit.farm.management.service;

import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.TicketEntity;
import fruit.farm.management.entity.TicketStatus;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.mapper.TicketMapper;
import fruit.farm.management.repository.TicketRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class TicketService {

    private TicketRepository ticketRepository;
    private UserService userService;

    @Transactional
    public TicketDto reportTicket(TicketDto ticketDto, UserDto reporter) {

        UserEntity user = userService.findUserEntityById(reporter.getId())
                .orElseThrow(() -> new NotFoundException(
                        String.format("Użytkownik o id %d nie istnieje", reporter.getId())));

        TicketEntity ticketEntity = new TicketEntity();
        ticketEntity.setUserEntity(user);
        ticketEntity.setDescription(ticketDto.getDescription());
        ticketEntity.setCategory(ticketDto.getCategory());
        ticketEntity.setCreatedAt(LocalDateTime.now());
        ticketEntity.setStatus(TicketStatus.OPEN);

        TicketEntity savedTicket = ticketRepository.save(ticketEntity);
        log.info("User {} reported ticket with id {}", user.getId(), savedTicket.getId());
        return TicketMapper.mapFromEntity(savedTicket);
    }

    public List<TicketDto> getTicketsByUser(Long userId) {

        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(TicketMapper::mapFromEntity)
                .toList();
    }

    public List<TicketDto> getAllTickets() {

        return ticketRepository.findAllOrderByCreatedAtDesc().stream()
                .map(TicketMapper::mapFromEntity)
                .toList();
    }

    @Transactional
    public TicketDto updateStatus(Long ticketId, TicketStatus status) {

        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(
                        String.format("Zgłoszenie o id %d nie istnieje", ticketId)));

        ticket.setStatus(status);
        ticket.setClosedAt(status == TicketStatus.CLOSED ? LocalDateTime.now() : null);

        TicketEntity saved = ticketRepository.save(ticket);
        log.info("Ticket {} status changed to {}", ticketId, status);
        return TicketMapper.mapFromEntity(saved);
    }

    @Transactional
    public TicketDto updateComment(Long ticketId, String comment) {

        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException(
                        String.format("Zgłoszenie o id %d nie istnieje", ticketId)));

        ticket.setAdminComment(comment != null && comment.isBlank() ? null : comment);

        TicketEntity saved = ticketRepository.save(ticket);
        log.info("Ticket {} admin comment updated", ticketId);
        return TicketMapper.mapFromEntity(saved);
    }
}
