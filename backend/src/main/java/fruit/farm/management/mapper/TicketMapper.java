package fruit.farm.management.mapper;

import fruit.farm.management.dto.TicketDto;
import fruit.farm.management.entity.TicketEntity;

public class TicketMapper {

    public static TicketDto mapFromEntity(TicketEntity ticketEntity) {

        return TicketDto.builder()
                .id(ticketEntity.getId())
                .description(ticketEntity.getDescription())
                .category(ticketEntity.getCategory())
                .createdAt(ticketEntity.getCreatedAt())
                .closedAt(ticketEntity.getClosedAt())
                .adminComment(ticketEntity.getAdminComment())
                .status(ticketEntity.getStatus())
                .userDto(ticketEntity.getUserEntity() != null
                        ? UserMapper.mapFromEntity(ticketEntity.getUserEntity())
                        : null)
                .build();
    }
}
