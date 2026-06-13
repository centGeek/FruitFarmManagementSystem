package fruit.farm.management.service;

import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService lookups")
class UserServiceTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    UserService service;

    private UserEntity simpleUser(String nickname) {
        UserEntity user = new UserEntity();
        user.setId(3L);
        user.setName("Anna");
        user.setSurname("Nowak");
        user.setNickname(nickname);
        return user;
    }

    @Test
    @DisplayName("findUserById returns the mapped user when present")
    void findUserById_whenPresent_returnsMappedUser() {
        when(userRepository.findById(3L)).thenReturn(Optional.of(simpleUser("anna")));

        Optional<UserDto> result = service.findUserById(3L);

        assertThat(result).isPresent();
        assertThat(result.get().getNickname()).isEqualTo("anna");
    }

    @Test
    @DisplayName("findUserById returns empty instead of throwing when absent")
    void findUserById_whenAbsent_returnsEmpty() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<UserDto> result = service.findUserById(99L);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findUserByNickname returns empty instead of throwing when absent")
    void findUserByNickname_whenAbsent_returnsEmpty() {
        when(userRepository.findByNickname("ghost")).thenReturn(Optional.empty());

        Optional<UserDto> result = service.findUserByNickname("ghost");

        assertThat(result).isEmpty();
    }
}