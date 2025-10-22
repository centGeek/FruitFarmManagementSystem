package fruit.farm.management.mapper;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.dto.UserDTO;

import java.time.LocalDate;

public class UserMapper {

    public static UserEntity mapToEntity(UserDTO userDTO, UserEntity gardener) {
        return new UserEntity(userDTO.getName(), userDTO.getSurname(), userDTO.getNickname(),
                userDTO.getPhoneNumber(), userDTO.getEmail(), userDTO.getCreationDate(), userDTO.getPassword(),
                new RoleEntity(3, RoleType.EMPLOYEE.getDisplayName()), userDTO.isActive(), gardener,
                CoordinateMapper.mapToEntity(userDTO.getCoordinateDTO(), null), userDTO.getLocalityName());
    }

    public static UserDTO mapFromEntity(UserEntity userEntity) {
        return new UserDTO(userEntity.getName(), userEntity.getSurname(), userEntity.getEmail(), userEntity.getCreationDate(),
                userEntity.getNickname(), userEntity.getPhoneNumber(), userEntity.getPassword(), userEntity.getPassword(),
                userEntity.isActive(), CoordinateMapper.mapFromEntity(userEntity.getCoordinateEntity()),
                userEntity.getLocalityName());
    }
}
