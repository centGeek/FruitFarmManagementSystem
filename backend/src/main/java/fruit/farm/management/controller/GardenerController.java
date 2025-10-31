package fruit.farm.management.controller;

import fruit.farm.management.dto.UserDTO;
import fruit.farm.management.dto.UserLocationDTO;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.exception.NicknameAlreadyExistsException;
import fruit.farm.management.exception.NotFoundException;
import fruit.farm.management.mapper.CoordinateMapper;
import fruit.farm.management.mapper.UserMapper;
import fruit.farm.management.repository.CoordinateRepository;
import fruit.farm.management.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gardener")
@AllArgsConstructor
@Slf4j
public class GardenerController {

    private final UserService userService;
    private final CoordinateRepository coordinateRepository;
    private UserEntity getGardenerId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedWithNickname = authentication.getName();

        return userService.findByNickname(loggedWithNickname)
                .orElseThrow(() -> new NotFoundException("Logged in gardener not found"));
    }

    @GetMapping
    public ResponseEntity<UserDTO> getGardenerProfile() {
        log.info("Attempting to fetch profile for logged-in gardener.");

        try {
            Long gardenerId = getGardenerId().getId();

            UserEntity gardener = userService.findById(gardenerId)
                    .orElseThrow(() -> new NotFoundException("Gardener not found with ID: " + gardenerId));

            UserDTO dto = UserMapper.mapFromEntity(gardener);

            return ResponseEntity.ok(dto);
        } catch (NotFoundException e) {
            log.error("Gardener profile not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error fetching gardener profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @PutMapping
    public ResponseEntity<Map<String, String>> updateGardenerProfile(
            @Valid @RequestBody UserDTO userDTO) {

        log.info("Attempting to update profile for logged-in gardener with nickname: {}", userDTO.getNickname());

        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            if (!userDTO.getPassword().equals(userDTO.getConfirmPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Hasła nie są zgodne"));
            }
        }

        try {
            Long gardenerId = getGardenerId().getId();
            UserEntity existingGardener = userService.findById(gardenerId)
                    .orElseThrow(() -> new NotFoundException("Gardener not found with ID: " + gardenerId));

            if (!userDTO.getNickname().equals(existingGardener.getNickname())) {
                if (userService.findByNickname(userDTO.getNickname()).isPresent()) {
                    throw new NicknameAlreadyExistsException("Ta nazwa użytkownika jest już zajęta");
                }
            }
            CoordinateEntity coordinateEntity = coordinateRepository.addCoordinate(
                    CoordinateMapper.mapToEntity(userDTO.getCoordinateDTO(), null));

            existingGardener.setCoordinateEntity(coordinateEntity);

            userService.update(existingGardener, userDTO);
            log.info("Gardener profile updated successfully for ID: {}", gardenerId);

            return ResponseEntity.ok(Map.of("message", "Profil został zaktualizowany pomyślnie!"));

        } catch (NotFoundException e) {
            log.error("Gardener not found during update: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (NicknameAlreadyExistsException e) {
            log.warn("Nickname conflict during update: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating gardener profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Błąd serwera podczas zapisu zmian: " + e.getMessage()));
        }
    }

    @GetMapping("/location")
    public ResponseEntity<UserLocationDTO> getUserLocationInformation() {
        UserEntity gardenerId = getGardenerId();
        UserLocationDTO userLocationDTO = new UserLocationDTO(
                gardenerId.getId(),
                CoordinateMapper.mapFromEntity(gardenerId.getCoordinateEntity()),
                gardenerId.getLocalityName()
        );
        return ResponseEntity.ok(userLocationDTO);
    }
}