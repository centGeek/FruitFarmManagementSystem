package fruit.farm.management.mapper;

import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.RoleType;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.UserRepository;
import org.springframework.stereotype.Service;

public class UserMapper {

    public static UserEntity mapToEntity(UserDto userDTO, UserEntity gardener) {

        return new UserEntity(userDTO.getId(), userDTO.getName(), userDTO.getSurname(), userDTO.getNickname(),
                userDTO.getPhoneNumber(), userDTO.getEmail(), userDTO.getCreationDate(),
                new RoleEntity(3, RoleType.EMPLOYEE.getDisplayName()), userDTO.isActive(), gardener,
                CoordinateMapper.mapToEntity(userDTO.getCoordinateDTO(), null), userDTO.getLocalityName(),
                null);
    }

    public static UserDto mapFromEntity(UserEntity userEntity) {

        if (userEntity.getCredentials() == null) {
            return new UserDto(userEntity.getId(), userEntity.getName(), userEntity.getSurname(), userEntity.getEmail(), userEntity.getCreationDate(),
                    userEntity.getNickname(), userEntity.getPhoneNumber(), userEntity.isActive(),
                    CoordinateMapper.mapFromEntity(userEntity.getCoordinateEntity()), userEntity.getLocalityName());
        }

        if(userEntity.getGardener() == null) {

            return new UserDto(userEntity.getId(), userEntity.getName(), userEntity.getSurname(), userEntity.getEmail(), userEntity.getCreationDate(),
                    userEntity.getNickname(), userEntity.getPhoneNumber(), userEntity.getCredentials().getPasswordHash(),
                    userEntity.getCredentials().getPasswordHash(), userEntity.isActive(), CoordinateMapper.mapFromEntity(userEntity.getCoordinateEntity()),
                    userEntity.getLocalityName(), null);
        }
        UserEntity gardener = userEntity.getGardener();
        UserDto newGardener = new UserDto(gardener.getId(), gardener.getName(), gardener.getSurname(),
                gardener.getEmail(), gardener.getCreationDate(), gardener.getNickname(), gardener.getPhoneNumber(),
                gardener.getCredentials().getPasswordHash(), gardener.getCredentials().getPasswordHash(), gardener.isActive(),
                CoordinateMapper.mapFromEntity(gardener.getCoordinateEntity()), gardener.getLocalityName(), null);

        return new UserDto(userEntity.getId(), userEntity.getName(), userEntity.getSurname(), userEntity.getEmail(), userEntity.getCreationDate(),
                userEntity.getNickname(), userEntity.getPhoneNumber(), userEntity.getCredentials().getPasswordHash(),
                userEntity.getCredentials().getPasswordHash(), userEntity.isActive(), CoordinateMapper.mapFromEntity(userEntity.getCoordinateEntity()),
                userEntity.getLocalityName(), newGardener);


    }
}
