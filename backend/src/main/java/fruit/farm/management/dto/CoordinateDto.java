package fruit.farm.management.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CoordinateDto {

    @NotNull(message = "Szerokość geograficzna jest wymagana")
    private Double latitude;

    @NotNull(message = "Długość geograficzna jest wymagana")
    private Double longitude;


    public CoordinateDto(Double latitude, Double longitude) {
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
        CoordinateDto that = (CoordinateDto) o;
        return latitude.equals(that.latitude) && longitude.equals(that.longitude);
    }

    @Override
    public int hashCode() {
        return latitude.hashCode() * 31 + longitude.hashCode();
    }
}