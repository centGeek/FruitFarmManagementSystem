//package fruit.farm.management.entity;
//
//import jakarta.persistence.*;
//import lombok.*;
//
//import java.math.BigDecimal;
//
//@NoArgsConstructor
//@AllArgsConstructor
//@Entity(name = "revenue_entity")
//@Getter
//@Setter
//@ToString
//public class RevenueEntity {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "revenue_id")
//    private long revenueId;
//
//    @Enumerated(EnumType.STRING)
//    @Column(name = "product_type")
//    private ProductType productType;
//
//    @Column(name = "expense_cost")
//    private BigDecimal expenseCost;
//
//    @Column(name = "description")
//    private String description;
//
//    @Column(name = "is_paid")
//    private boolean isPaid;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "user_id")
//    private UserEntity userEntity;
//
//    public RevenueEntity(ProductType productType, BigDecimal expenseCost, String description, UserEntity userEntity, boolean isPaid) {
//        this.productType = productType;
//        this.expenseCost = expenseCost;
//        this.description = description;
//        this.userEntity = userEntity;
//        this.isPaid = isPaid;
//    }
//}
