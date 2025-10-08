package fruit.farm.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

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
    private BigDecimal createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity userEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id")
    private SectorEntity sectorEntity;


}
