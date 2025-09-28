package fruit.farm.management.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CoordinateDTO {

    // Getters and Setters
    @NotNull(message = "Szerokość geograficzna jest wymagana")
    @DecimalMin(value = "-90.0", message = "Szerokość geograficzna musi być >= -90")
    @DecimalMax(value = "90.0", message = "Szerokość geograficzna musi być <= 90")
    private Double latitude;

    @NotNull(message = "Długość geograficzna jest wymagana")
    @DecimalMin(value = "-180.0", message = "Długość geograficzna musi być >= -180")
    @DecimalMax(value = "180.0", message = "Długość geograficzna musi być <= 180")
    private Double longitude;


    public CoordinateDTO(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    @Override
    public String toString() {
        return "CoordinateDTO{" +
                "latitude=" + latitude +
                ", longitude=" + longitude +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CoordinateDTO that = (CoordinateDTO) o;
        return latitude.equals(that.latitude) && longitude.equals(that.longitude);
    }

    @Override
    public int hashCode() {
        return latitude.hashCode() * 31 + longitude.hashCode();
    }
}