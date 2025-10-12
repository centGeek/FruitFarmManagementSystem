package fruit.farm.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "expense_entity")
@Getter
@Setter
@ToString
public class ExpenseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "expense_id")
    private long expenseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type")
    private ProductType productType;

    @Column(name = "expense_cost")
    private BigDecimal expenseCost;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "is_paid")
    private boolean isPaid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity userEntity;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id")
    private SectorEntity sectorEntity;

    public ExpenseEntity(ProductType productType, BigDecimal expenseCost, String description, UserEntity userEntity,
                         boolean isPaid, SectorEntity sectorEntity) {
        this.productType = productType;
        this.expenseCost = expenseCost;
        this.description = description;
        this.userEntity = userEntity;
        this.isPaid = isPaid;
        this.sectorEntity = sectorEntity;
    }
}
