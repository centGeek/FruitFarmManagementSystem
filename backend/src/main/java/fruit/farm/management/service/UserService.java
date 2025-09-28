package fruit.farm.management.service;

import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
@Service
@AllArgsConstructor
@Slf4j
public class UserService {

    private UserRepository userRepository;
    public UserEntity getLoggedInUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInEmail = authentication.getName();

        return userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> {
                    log.error("Logged in user with email {} not found in database.", loggedInEmail);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Zalogowany użytkownik nie istnieje w bazie danych.");
                });
    }
}
