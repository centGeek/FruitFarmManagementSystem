package fruit.farm.management.service;

import fruit.farm.management.dto.CoordinateDto;
import fruit.farm.management.dto.NotificationDto;
import fruit.farm.management.dto.SectorDto;
import fruit.farm.management.dto.UserDto;
import fruit.farm.management.entity.CoordinateEntity;
import fruit.farm.management.entity.PlantType;
import fruit.farm.management.entity.SectorEntity;
import fruit.farm.management.entity.UserEntity;
import fruit.farm.management.repository.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SectorService")
class SectorServiceTest {

    @Mock
    SectorRepository sectorRepository;

    @Mock
    NotificationService notificationService;

    @InjectMocks
    SectorService service;

    @Captor
    ArgumentCaptor<SectorEntity> sectorCaptor;

    @Captor
    ArgumentCaptor<NotificationDto> notificationCaptor;

    private UserDto gardener;

    @BeforeEach
    void setUp() {
        gardener = new UserDto();
        gardener.setId(7L);
        gardener.setName("Jan");
        gardener.setSurname("Sadownik");
        gardener.setEmail("jan@orch.com");
        gardener.setNickname("jan");
        gardener.setPhoneNumber("123456789");
    }

    private List<CoordinateDto> squareCoordinates() {
        List<CoordinateDto> coords = new ArrayList<>();
        coords.add(new CoordinateDto(50.0, 19.0));
        coords.add(new CoordinateDto(50.0, 19.1));
        coords.add(new CoordinateDto(50.1, 19.1));
        coords.add(new CoordinateDto(50.1, 19.0));
        return coords;
    }

    private SectorDto incomingSector() {
        SectorDto dto = new SectorDto("Wschodni kwartał jabłoni", PlantType.JABŁOŃ,
                "GALA", squareCoordinates());
        return dto;
    }

    private SectorEntity persistedSector(long id, long ownerId, boolean active) {
        SectorEntity sector = new SectorEntity();
        sector.setSectorId(id);
        sector.setDescription("Wschodni kwartał jabłoni");
        sector.setPlantType(PlantType.JABŁOŃ);
        sector.setVariety("GALA");
        sector.setCreatedAt(LocalDate.of(2026, 1, 1));
        sector.setIsActive(active);

        UserEntity owner = new UserEntity();
        owner.setId(ownerId);
        sector.setUserEntity(owner);

        List<CoordinateEntity> coords = new ArrayList<>();
        for (CoordinateDto c : squareCoordinates()) {
            coords.add(new CoordinateEntity(c.getLatitude(), c.getLongitude(), sector));
        }
        sector.setCoordinates(coords);
        return sector;
    }

    // ----- createSector -----

    @Test
    @DisplayName("createSector persists an active sector with the current creation date and the supplied owner")
    void createSector_whenCalled_savesActiveSectorWithOwnerAndCreationDate() {
        when(sectorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SectorDto result = service.createSector(incomingSector(), gardener);

        verify(sectorRepository).save(sectorCaptor.capture());
        SectorEntity saved = sectorCaptor.getValue();
        assertThat(saved.getIsActive()).isTrue();
        assertThat(saved.getCreatedAt()).isEqualTo(LocalDate.now());
        assertThat(saved.getDescription()).isEqualTo("Wschodni kwartał jabłoni");
        assertThat(saved.getPlantType()).isEqualTo(PlantType.JABŁOŃ);
        assertThat(saved.getVariety()).isEqualTo("GALA");
        assertThat(saved.getUserEntity().getId()).isEqualTo(7L);
        assertThat(saved.getCoordinates()).hasSize(4);
        assertThat(saved.getCoordinates())
                .extracting(CoordinateEntity::getLatitude)
                .containsExactly(50.0, 50.0, 50.1, 50.1);

        assertThat(result.getDescription()).isEqualTo("Wschodni kwartał jabłoni");
        assertThat(result.getPlantType()).isEqualTo(PlantType.JABŁOŃ);
        assertThat(result.getVariety()).isEqualTo("GALA");
        assertThat(result.getCoordinates()).hasSize(4);
    }

    @Test
    @DisplayName("createSector emits a sector notification describing the saved sector")
    void createSector_whenCalled_emitsSectorNotification() {
        when(sectorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.createSector(incomingSector(), gardener);

        verify(notificationService).addSectorNotification(notificationCaptor.capture(), eq(gardener));
        NotificationDto sent = notificationCaptor.getValue();
        assertThat(sent.getTitle()).isEqualTo("Dodano nowy sektor w gospodarstwie!");
        assertThat(sent.getMessage())
                .contains("Wschodni kwartał jabłoni")
                .contains("JABŁOŃ")
                .contains("GALA");
        assertThat(sent.getCreatedAt()).isNotNull();
        assertThat(sent.getUserDto()).isSameAs(gardener);
    }

    // ----- updateSector -----

    @Test
    @DisplayName("updateSector overwrites the description, plant type, variety and coordinates of an existing sector")
    void updateSector_whenSectorExists_overwritesFieldsAndCoordinates() {
        SectorEntity existing = persistedSector(11L, 7L, true);
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(existing));
        when(sectorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SectorDto update = new SectorDto(11L, "Zachodni kwartał gruszy", PlantType.GRUSZA,
                "KONFERENCJA", List.of(
                new CoordinateDto(51.0, 20.0),
                new CoordinateDto(51.0, 20.1),
                new CoordinateDto(51.1, 20.1),
                new CoordinateDto(51.1, 20.0)),
                LocalDate.of(2026, 1, 1), true);

        service.updateSector(update);

        verify(sectorRepository).save(sectorCaptor.capture());
        SectorEntity saved = sectorCaptor.getValue();
        assertThat(saved.getDescription()).isEqualTo("Zachodni kwartał gruszy");
        assertThat(saved.getPlantType()).isEqualTo(PlantType.GRUSZA);
        assertThat(saved.getVariety()).isEqualTo("KONFERENCJA");
        assertThat(saved.getCoordinates())
                .extracting(CoordinateEntity::getLatitude)
                .containsExactly(51.0, 51.0, 51.1, 51.1);
        assertThat(saved.getCoordinates())
                .extracting(CoordinateEntity::getLongitude)
                .containsExactly(20.0, 20.1, 20.1, 20.0);
    }

    @Test
    @DisplayName("updateSector leaves the active flag unchanged when the DTO does not specify it")
    void updateSector_whenIsActiveNull_leavesActiveFlagUnchanged() {
        SectorEntity existing = persistedSector(11L, 7L, true);
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(existing));
        when(sectorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SectorDto update = new SectorDto();
        update.setId(11L);
        update.setDescription("Nowy opis");
        update.setPlantType(PlantType.JABŁOŃ);
        update.setVariety("GALA");
        update.setCoordinates(squareCoordinates());
        update.setIsActive(null);

        service.updateSector(update);

        verify(sectorRepository).save(sectorCaptor.capture());
        assertThat(sectorCaptor.getValue().getIsActive()).isTrue();
    }

    @Test
    @DisplayName("updateSector archives the sector when the DTO sets the active flag to false")
    void updateSector_whenIsActiveFalse_archivesSector() {
        SectorEntity existing = persistedSector(11L, 7L, true);
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(existing));
        when(sectorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SectorDto update = new SectorDto(11L, "Wschodni kwartał jabłoni", PlantType.JABŁOŃ,
                "GALA", squareCoordinates(), LocalDate.of(2026, 1, 1), false);

        service.updateSector(update);

        verify(sectorRepository).save(sectorCaptor.capture());
        assertThat(sectorCaptor.getValue().getIsActive()).isFalse();
    }

    @Test
    @DisplayName("updateSector throws a runtime exception when the sector does not exist")
    void updateSector_whenSectorMissing_throwsRuntimeException() {
        when(sectorRepository.findById(99L)).thenReturn(Optional.empty());

        SectorDto update = new SectorDto(99L, "x", PlantType.JABŁOŃ, "GALA",
                squareCoordinates(), LocalDate.of(2026, 1, 1), true);

        assertThatThrownBy(() -> service.updateSector(update))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Sector not found");
        verify(sectorRepository, never()).save(any());
    }

    // ----- getSectorById -----

    @Test
    @DisplayName("getSectorById returns the mapped DTO of an existing sector")
    void getSectorById_whenSectorExists_returnsMappedDto() {
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(persistedSector(11L, 7L, true)));

        SectorDto result = service.getSectorById(11L);

        assertThat(result.getId()).isEqualTo(11L);
        assertThat(result.getDescription()).isEqualTo("Wschodni kwartał jabłoni");
        assertThat(result.getPlantType()).isEqualTo(PlantType.JABŁOŃ);
        assertThat(result.getVariety()).isEqualTo("GALA");
        assertThat(result.getCreatedAt()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(result.getCoordinates()).hasSize(4);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("getSectorById throws a runtime exception when the sector does not exist")
    void getSectorById_whenSectorMissing_throwsRuntimeException() {
        when(sectorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSectorById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Sector not found");
    }

    // ----- getAllActiveSectorsByUserId -----

    @Test
    @DisplayName("getAllActiveSectorsByUserId maps every active sector returned by the repository")
    void getAllActiveSectorsByUserId_mapsAllSectors() {
        when(sectorRepository.findAllActiveByUserId(7L))
                .thenReturn(List.of(persistedSector(11L, 7L, true), persistedSector(12L, 7L, true)));

        List<SectorDto> result = service.getAllActiveSectorsByUserId(7L);

        assertThat(result).hasSize(2)
                .extracting(SectorDto::getId)
                .containsExactly(11L, 12L);
    }

    @Test
    @DisplayName("getAllActiveSectorsByUserId returns an empty list when the gardener has no active sectors")
    void getAllActiveSectorsByUserId_whenNone_returnsEmptyList() {
        when(sectorRepository.findAllActiveByUserId(7L)).thenReturn(List.of());

        List<SectorDto> result = service.getAllActiveSectorsByUserId(7L);

        assertThat(result).isEmpty();
    }

    // ----- getAllArchivedSectorsByUserId -----

    @Test
    @DisplayName("getAllArchivedSectorsByUserId maps every archived sector returned by the repository")
    void getAllArchivedSectorsByUserId_mapsAllSectors() {
        when(sectorRepository.findAllArchivedByUserId(7L))
                .thenReturn(List.of(persistedSector(20L, 7L, false)));

        List<SectorDto> result = service.getAllArchivedSectorsByUserId(7L);

        assertThat(result).hasSize(1)
                .extracting(SectorDto::getId)
                .containsExactly(20L);
    }

    @Test
    @DisplayName("getAllArchivedSectorsByUserId returns an empty list when the gardener has no archived sectors")
    void getAllArchivedSectorsByUserId_whenNone_returnsEmptyList() {
        when(sectorRepository.findAllArchivedByUserId(7L)).thenReturn(List.of());

        List<SectorDto> result = service.getAllArchivedSectorsByUserId(7L);

        assertThat(result).isEmpty();
    }

    // ----- updateSectors -----

    @Test
    @DisplayName("updateSectors rebuilds coordinates and returns the mapped DTO for each owned sector")
    void updateSectors_whenOwned_updatesAndReturnsMappedDtos() {
        SectorEntity existing = persistedSector(11L, 7L, true);
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(existing));
        when(sectorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SectorDto update = new SectorDto(11L, "Zaktualizowany sektor", PlantType.WIŚNIA,
                "KORDIA", List.of(
                new CoordinateDto(52.0, 21.0),
                new CoordinateDto(52.0, 21.1),
                new CoordinateDto(52.1, 21.1)),
                LocalDate.of(2026, 1, 1), true);

        List<SectorDto> result = service.updateSectors(List.of(update), 7L);

        verify(sectorRepository).save(sectorCaptor.capture());
        SectorEntity saved = sectorCaptor.getValue();
        assertThat(saved.getDescription()).isEqualTo("Zaktualizowany sektor");
        assertThat(saved.getPlantType()).isEqualTo(PlantType.WIŚNIA);
        assertThat(saved.getVariety()).isEqualTo("KORDIA");
        assertThat(saved.getCoordinates())
                .extracting(CoordinateEntity::getLongitude)
                .containsExactly(21.0, 21.1, 21.1);
        assertThat(saved.getCoordinates())
                .allSatisfy(c -> assertThat(c.getSector()).isSameAs(existing));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(11L);
        assertThat(result.get(0).getDescription()).isEqualTo("Zaktualizowany sektor");
    }

    @Test
    @DisplayName("updateSectors returns an empty list when given no sectors")
    void updateSectors_whenEmptyInput_returnsEmptyList() {
        List<SectorDto> result = service.updateSectors(List.of(), 7L);

        assertThat(result).isEmpty();
        verify(sectorRepository, never()).save(any());
        verify(sectorRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("updateSectors throws IllegalArgumentException naming the sector that does not exist")
    void updateSectors_whenSectorMissing_throwsIllegalArgument() {
        when(sectorRepository.findById(404L)).thenReturn(Optional.empty());

        SectorDto update = new SectorDto(404L, "x", PlantType.JABŁOŃ, "GALA",
                squareCoordinates(), LocalDate.of(2026, 1, 1), true);

        assertThatThrownBy(() -> service.updateSectors(List.of(update), 7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Sector not found: 404");
        verify(sectorRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateSectors throws SecurityException when the sector belongs to a different gardener")
    void updateSectors_whenSectorOwnedByAnotherUser_throwsSecurityException() {
        SectorEntity existing = persistedSector(11L, 999L, true);
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(existing));

        SectorDto update = new SectorDto(11L, "x", PlantType.JABŁOŃ, "GALA",
                squareCoordinates(), LocalDate.of(2026, 1, 1), true);

        assertThatThrownBy(() -> service.updateSectors(List.of(update), 7L))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Unauthorized access to sector: 11");
        verify(sectorRepository, never()).save(any());
    }

    // ----- findById -----

    @Test
    @DisplayName("findById delegates to the repository and returns the optional entity")
    void findById_delegatesToRepository() {
        SectorEntity entity = persistedSector(11L, 7L, true);
        when(sectorRepository.findById(11L)).thenReturn(Optional.of(entity));

        Optional<SectorEntity> result = service.findById(11L);

        assertThat(result).containsSame(entity);
        verify(sectorRepository).findById(11L);
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("findById returns an empty optional when the repository has no matching sector")
    void findById_whenMissing_returnsEmptyOptional() {
        when(sectorRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<SectorEntity> result = service.findById(99L);

        assertThat(result).isEmpty();
    }
}
