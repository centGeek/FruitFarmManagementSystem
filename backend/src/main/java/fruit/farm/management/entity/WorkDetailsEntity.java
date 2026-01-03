package fruit.farm.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "work_details_entity")
@Getter
@Setter
@ToString
public class WorkDetailsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "is_paid_hourly")
    private Boolean isPaidHourly;

    @Column(name = "hourly_pay")
    private BigDecimal hourlyPay;

    @Column(name = "pay_per_kilogram")
    private BigDecimal payPerKilogram;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_entity")
    private UserEntity userEntity;
}