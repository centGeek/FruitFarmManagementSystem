package fruit.farm.management.mapper;

import fruit.farm.management.dto.UserCredentialsDTO;
import fruit.farm.management.entity.UserCredentialsEntity;
import fruit.farm.management.entity.UserEntity;

public class UserCredentialsMapper {

    public static UserCredentialsEntity mapToEntity(UserEntity userEntity, UserCredentialsDTO userCredentialsDTO) {

        return new UserCredentialsEntity(userEntity, userCredentialsDTO.getPassword());
    }

    public static UserCredentialsDTO mapFromEntity(UserCredentialsEntity userCredentialsEntity) {

        return new UserCredentialsDTO(userCredentialsEntity.getPasswordHash(), userCredentialsEntity.getPasswordHash());
    }
}
