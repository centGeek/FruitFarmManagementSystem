package fruit.farm.management.dto;

import fruit.farm.management.entity.PlantType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Setter
@Getter
public class SectorDto {

    private Long id;

    @NotBlank(message = "{sector.description.required}")
    @Size(max = 255, message = "{sector.description.size}")
    private String description;

    private PlantType plantType;

    private String variety;

    @NotEmpty(message = "{sector.coordinates.required}")
    @Size(min = 4, message = "{sector.coordinates.min}")
    @Size(max = 4, message = "{sector.coordinates.max}")
    @Valid
    private List<CoordinateDto> coordinates;

    private LocalDate createdAt;

    private Boolean isActive;

    public SectorDto() {}

    public SectorDto(String description, PlantType plantType, String variety, List<CoordinateDto> coordinates) {
        this.description = description;
        this.plantType = plantType;
        this.coordinates = coordinates;
        this.variety = variety;
    }

    public SectorDto(Long id, String description, PlantType plantType, String variety,
                     List<CoordinateDto> coordinates, LocalDate createdAt, boolean isActive) {
        this.id = id;
        this.description = description;
        this.plantType = plantType;
        this.coordinates = coordinates;
        this.createdAt = createdAt;
        this.variety = variety;
        this.isActive = isActive;
    }

    @Override
    public String toString() {
        return "SectorDTO{" +
                "id=" + id +
                ", description='" + description + '\'' +
                ", plantType='" + plantType + '\'' +
                ", variety=" + variety + '\'' +
                ", coordinates=" + coordinates +
                ", createdAt=" + createdAt +
                '}';
    }
}