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

    @NotBlank(message = "Opis sektora jest wymagany")
    @Size(max = 255, message = "Opis nie może przekraczać 255 znaków")
    private String description;

    private PlantType plantType;

    private String variety;

    @NotEmpty(message = "Współrzędne są wymagane")
    @Size(min = 4, message = "Wymagane co najmniej 4 punkty")
    @Size(max = 4, message = "Wymagane co najwięcej 4 punkty")
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