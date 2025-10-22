package fruit.farm.management.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserLocationDTO {

    private long userId;

    private CoordinateDTO coordinateDTO;

    private String locationName;

}
