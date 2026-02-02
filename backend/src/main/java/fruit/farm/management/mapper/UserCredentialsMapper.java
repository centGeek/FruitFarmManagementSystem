package fruit.farm.management.mapper;

import fruit.farm.management.dto.UserCredentialsDto;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;

public class UserCredentialsMapper {

    public static UserCredentialsEntity mapToEntity(UserEntity userEntity, UserCredentialsDto userCredentialsDTO) {

        return new UserCredentialsEntity(userEntity, userCredentialsDTO.getPassword());
    }

    public static UserCredentialsDto mapFromEntity(UserCredentialsEntity userCredentialsEntity) {

        if (userCredentialsEntity == null) {
            return null;
        }
        return new UserCredentialsDto(userCredentialsEntity.getPasswordHash(), userCredentialsEntity.getPasswordHash());
    }
}
