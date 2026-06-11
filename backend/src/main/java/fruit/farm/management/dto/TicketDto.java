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

    @NotBlank(message = "Opis usterki jest wymagany")
    @Size(min = 5, max = 2000, message = "Opis musi mieć między 5 a 2000 znaków")
    private String description;

    @Size(max = 64, message = "Kategoria może mieć maksymalnie 64 znaki")
    private String category;

    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    private TicketStatus status;

    private UserDto userDto;
}
