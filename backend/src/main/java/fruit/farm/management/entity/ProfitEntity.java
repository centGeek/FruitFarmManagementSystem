package fruit.farm.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "profit_entity")
@Getter
@Setter
@ToString
public class ProfitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_id")
    private long purchaseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "profit_type")
    private ProfitType profitType;

    @Column(name = "profit")
    private BigDecimal profit;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "received")
    private boolean received;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity userEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id")
    private SectorEntity sectorEntity;

    public ProfitEntity(ProfitType profitType, BigDecimal profit, String description, LocalDate createdAt,
                        boolean received, UserEntity userEntity, SectorEntity sectorEntity) {
        this.profitType = profitType;
        this.profit = profit;
        this.description = description;
        this.createdAt = createdAt;
        this.received = received;
        this.userEntity = userEntity;
        this.sectorEntity = sectorEntity;
    }
}
