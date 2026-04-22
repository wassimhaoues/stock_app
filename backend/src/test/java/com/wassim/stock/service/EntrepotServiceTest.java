package com.wassim.stock.service;

import com.wassim.stock.dto.request.EntrepotRequest;
import com.wassim.stock.dto.response.EntrepotResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ConflictException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EntrepotServiceTest {

    @Mock private EntrepotRepository entrepotRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private StockRepository stockRepository;
    @Mock private MouvementStockRepository mouvementStockRepository;

    @InjectMocks private EntrepotService entrepotService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void findAllForAdminReturnsAllEntrepots() {
        Utilisateur admin = utilisateur(1L, "admin@stockpro.local", Role.ADMIN, null);
        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(entrepotRepository.findAll()).thenReturn(List.of(entrepot(1L, "Tunis", 100), entrepot(2L, "Sfax", 200)));
        when(stockRepository.sumQuantiteByEntrepotId(any())).thenReturn(0L);

        List<EntrepotResponse> result = entrepotService.findAll();

        assertThat(result).hasSize(2);
    }

    @Test
    void findAllForGestionnaireReturnsOnlyAssignedEntrepot() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Utilisateur gestionnaire = utilisateur(2L, "g@stockpro.local", Role.GESTIONNAIRE, tunis);
        authenticateAs(gestionnaire.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(gestionnaire.getEmail())).thenReturn(Optional.of(gestionnaire));
        when(stockRepository.sumQuantiteByEntrepotId(tunis.getId())).thenReturn(0L);

        List<EntrepotResponse> result = entrepotService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(tunis.getId());
    }

    @Test
    void findByIdThrowsForNonAdminAccessingOtherEntrepot() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Entrepot sfax = entrepot(2L, "Sfax", 100);
        Utilisateur gestionnaire = utilisateur(3L, "g@stockpro.local", Role.GESTIONNAIRE, tunis);
        authenticateAs(gestionnaire.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(gestionnaire.getEmail())).thenReturn(Optional.of(gestionnaire));
        when(entrepotRepository.findById(sfax.getId())).thenReturn(Optional.of(sfax));

        assertThatThrownBy(() -> entrepotService.findById(sfax.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createThrowsWhenNameAlreadyExists() {
        when(entrepotRepository.findByNomIgnoreCase("Tunis")).thenReturn(Optional.of(entrepot(1L, "Tunis", 100)));

        assertThatThrownBy(() -> entrepotService.create(new EntrepotRequest("Tunis", "Rue Habib", 100)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("existe deja");
        verify(entrepotRepository, never()).save(any());
    }

    @Test
    void createSavesAndReturnsEntrepot() {
        when(entrepotRepository.findByNomIgnoreCase("Sfax")).thenReturn(Optional.empty());
        when(entrepotRepository.save(any(Entrepot.class))).thenAnswer(inv -> {
            Entrepot e = inv.getArgument(0);
            e.setId(5L);
            return e;
        });
        when(stockRepository.sumQuantiteByEntrepotId(5L)).thenReturn(0L);

        EntrepotResponse response = entrepotService.create(new EntrepotRequest("Sfax", "Rue Habib", 200));

        assertThat(response.nom()).isEqualTo("Sfax");
        assertThat(response.capacite()).isEqualTo(200);
    }

    @Test
    void updateThrowsWhenNewCapacityBelowUsed() {
        Entrepot e = entrepot(1L, "Tunis", 100);
        when(entrepotRepository.findById(1L)).thenReturn(Optional.of(e));
        when(entrepotRepository.findByNomIgnoreCase("Tunis")).thenReturn(Optional.of(e));
        when(stockRepository.sumQuantiteByEntrepotId(1L)).thenReturn(80L);

        assertThatThrownBy(() -> entrepotService.update(1L, new EntrepotRequest("Tunis", "Rue Habib", 50)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Capacite insuffisante");
        verify(entrepotRepository, never()).save(any());
    }

    @Test
    void deleteThrowsWhenUsersAssigned() {
        when(entrepotRepository.findById(1L)).thenReturn(Optional.of(entrepot(1L, "Tunis", 100)));
        when(utilisateurRepository.existsByEntrepotId(1L)).thenReturn(true);

        assertThatThrownBy(() -> entrepotService.delete(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("utilisateur");
        verify(entrepotRepository, never()).delete(any());
    }

    @Test
    void deleteThrowsWhenStocksLinked() {
        when(entrepotRepository.findById(1L)).thenReturn(Optional.of(entrepot(1L, "Tunis", 100)));
        when(utilisateurRepository.existsByEntrepotId(1L)).thenReturn(false);
        when(stockRepository.existsByEntrepotId(1L)).thenReturn(true);

        assertThatThrownBy(() -> entrepotService.delete(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("stocks ou mouvements");
        verify(entrepotRepository, never()).delete(any());
    }

    @Test
    void deleteSucceedsWhenEntrepotIsUnlinked() {
        Entrepot e = entrepot(1L, "Tunis", 100);
        when(entrepotRepository.findById(1L)).thenReturn(Optional.of(e));
        when(utilisateurRepository.existsByEntrepotId(1L)).thenReturn(false);
        when(stockRepository.existsByEntrepotId(1L)).thenReturn(false);
        when(mouvementStockRepository.existsByEntrepotId(1L)).thenReturn(false);

        entrepotService.delete(1L);

        verify(entrepotRepository).delete(e);
    }

    private void authenticateAs(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of())
        );
    }

    private Entrepot entrepot(Long id, String nom, int capacite) {
        Entrepot e = new Entrepot();
        e.setId(id);
        e.setNom(nom);
        e.setAdresse("Adresse " + nom);
        e.setCapacite(capacite);
        return e;
    }

    private Utilisateur utilisateur(Long id, String email, Role role, Entrepot entrepot) {
        Utilisateur u = new Utilisateur();
        u.setId(id);
        u.setNom("Utilisateur");
        u.setEmail(email);
        u.setMotDePasse("encoded");
        u.setRole(role);
        u.setEntrepot(entrepot);
        return u;
    }
}
