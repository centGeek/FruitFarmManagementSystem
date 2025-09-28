package fruit.farm.management.mapper;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.dto.UserDTO;

import java.time.LocalDate;

public class UserMapper {


    public static UserEntity userDTOToEmployeeUserEntity(UserDTO userDTO, UserEntity gardener) {
        return new UserEntity(userDTO.getName(), userDTO.getSurname(), userDTO.getNickname(),
                userDTO.getPhoneNumber(), userDTO.getEmail(), LocalDate.now(), userDTO.getPassword(), new RoleEntity(3, RoleType.EMPLOYEE.getDisplayName()),
                userDTO.isActive(), gardener);
    }

}
