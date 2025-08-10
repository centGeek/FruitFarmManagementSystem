package fruit.farm.management.config;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class OrchardDetailsService implements UserDetailsService {


    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<UserEntity> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            throw new NotFoundException("User with email [%s] and given password doesn't exist".formatted(email));
        }
        List<SimpleGrantedAuthority> authorities = getUserAuthority(Set.of(user.get().getRole()));
        return buildUserForAuthentication(user.get(), authorities);
    }

    private List<SimpleGrantedAuthority> getUserAuthority(Set<RoleEntity> userRoles) {
        return userRoles.stream()
                .map(role -> new SimpleGrantedAuthority(role.getRoleName()))
                .distinct()
                .toList();
    }

    private UserDetails buildUserForAuthentication(
            UserEntity user,
            List<SimpleGrantedAuthority> authorities
    ) {
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.isActive(),
                true,
                true,
                true,
                authorities
        );
    }
}
