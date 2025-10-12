package fruit.farm.management.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "task_definition")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDefinitionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_def_id")
    private Long taskDefId;

    @Column(name = "task_name", nullable = false, unique = true, length = 100)
    private String taskName;

    @Column(name = "task_category", length = 50)
    private String taskCategory;

    @Column(name = "default_rate", precision = 10, scale = 2)
    private BigDecimal defaultRate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}