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
public class SectorDTO {

    private Long id;

    @NotBlank(message = "Opis sektora jest wymagany")
    @Size(max = 255, message = "Opis nie może przekraczać 255 znaków")
    private String description;

    private PlantType plantType;

    @NotEmpty(message = "Współrzędne są wymagane")
    @Size(min = 3, message = "Wymagane co najmniej 3 punkty")
    @Valid
    private List<CoordinateDTO> coordinates;

    private LocalDate createdAt;

    private Double areaInSquareMeters;

    public SectorDTO() {}

    public SectorDTO(String description, PlantType plantType, List<CoordinateDTO> coordinates) {
        this.description = description;
        this.plantType = plantType;
        this.coordinates = coordinates;
    }

    public SectorDTO(Long id, String description, PlantType plantType,
                     List<CoordinateDTO> coordinates, LocalDate createdAt, Double areaInSquareMeters) {
        this.id = id;
        this.description = description;
        this.plantType = plantType;
        this.coordinates = coordinates;
        this.createdAt = createdAt;
        this.areaInSquareMeters = areaInSquareMeters;
    }

    @Override
    public String toString() {
        return "SectorDTO{" +
                "id=" + id +
                ", description='" + description + '\'' +
                ", plantType='" + plantType + '\'' +
                ", coordinates=" + coordinates +
                ", createdAt=" + createdAt +
                ", areaInSquareMeters=" + areaInSquareMeters +
                '}';
    }
}