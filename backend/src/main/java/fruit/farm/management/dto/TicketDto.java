package fruit.farm.management.dto;

import fruit.farm.management.entity.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketDto {

    private Long id;

    @NotBlank(message = "{ticket.description.required}")
    @Size(min = 5, max = 2000, message = "{ticket.description.size}")
    private String description;

    @Size(max = 64, message = "{ticket.category.size}")
    private String category;

    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    private TicketStatus status;

    @Size(max = 2000, message = "{ticket.adminComment.size}")
    private String adminComment;

    private UserDto userDto;
}
