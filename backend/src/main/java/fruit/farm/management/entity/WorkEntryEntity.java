package fruit.farm.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_entry")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entry_id")
    private Long entryId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "duration")
    private int duration;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", columnDefinition = "TEXT")
    private WorkType workType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "day_salary", nullable = false)
    private BigDecimal daySalary;

    @Column(name = "kilograms_picked", nullable = false)
    private long kilogramsPicked;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "sector_id")
    private SectorEntity sector;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}