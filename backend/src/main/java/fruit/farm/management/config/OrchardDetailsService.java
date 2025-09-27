package fruit.farm.management.config;

import fruit.farm.management.entity.RoleEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
@Service
@Slf4j
public class OrchardDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.warn("User not found: {}", email);
            throw new UsernameNotFoundException("User with email [%s] doesn't exist".formatted(email));
        }

        UserEntity user = userOpt.get();
        log.info("Loading user: {}, active: {}, role: {}",
                email, user.isActive(),
                user.getRole() != null ? user.getRole().getRoleName() : "null");

        if (user.getRole() == null) {
            log.error("User {} has no role assigned", email);
            throw new UsernameNotFoundException("User has no role assigned");
        }

        List<SimpleGrantedAuthority> authorities = getUserAuthority(Set.of(user.getRole()));
        log.info("User {} loaded with authorities: {}", email, authorities);

        return buildUserForAuthentication(user, authorities);
    }

    private List<SimpleGrantedAuthority> getUserAuthority(Set<RoleEntity> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            log.warn("No roles provided, returning empty authorities");
            return Collections.emptyList();
        }

        List<SimpleGrantedAuthority> authorities = userRoles.stream()
                .filter(role -> role != null && role.getRoleName() != null)
                .map(role -> {
                    String roleName = role.getRoleName().trim();
                    log.debug("Creating authority for role: {}", roleName);
                    return new SimpleGrantedAuthority(roleName);
                })
                .distinct()
                .toList();

        log.debug("Created authorities: {}", authorities);
        return authorities;
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