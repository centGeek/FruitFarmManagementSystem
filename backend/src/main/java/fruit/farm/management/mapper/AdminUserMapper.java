package fruit.farm.management.mapper;

import fruit.farm.management.dto.AdminUserDto;
import fruit.farm.management.entity.UserEntity;

public class AdminUserMapper {

    public static AdminUserDto mapFromEntity(UserEntity user, long employeeCount) {

        UserEntity gardener = user.getGardener();

        return AdminUserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : null)
                .isActive(user.isActive())
                .creationDate(user.getCreationDate())
                .localityName(user.getLocalityName())
                .gardenerId(gardener != null ? gardener.getId() : null)
                .gardenerName(gardener != null ? (gardener.getName() + " " + gardener.getSurname()).trim() : null)
                .employeeCount(employeeCount)
                .build();
    }
}
