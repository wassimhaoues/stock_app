package com.wassim.stock.service;

import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UtilisateurServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private EntrepotRepository entrepotRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UtilisateurService utilisateurService;

    @Test
    void createRejectsDuplicateEmail() {
        UtilisateurRequest request = new UtilisateurRequest(
                "Admin",
                "admin@stockpro.local",
                "Admin123!",
                Role.ADMIN,
                null
        );

        when(utilisateurRepository.existsByEmailIgnoreCase(request.email())).thenReturn(true);

        assertThatThrownBy(() -> utilisateurService.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("email existe deja");
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    void createRequiresWarehouseForGestionnaire() {
        UtilisateurRequest request = new UtilisateurRequest(
                "Gestionnaire",
                "gestionnaire@stockpro.local",
                "Gestion123!",
                Role.GESTIONNAIRE,
                null
        );

        assertThatThrownBy(() -> utilisateurService.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("affecte a un entrepot");
        verify(utilisateurRepository, never()).save(any());
    }

    @Test
    void createLoadsAssignedWarehouseForObserver() {
        Entrepot entrepot = new Entrepot();
        entrepot.setId(1L);
        entrepot.setNom("Tunis");
        entrepot.setAdresse("Adresse Tunis");
        entrepot.setCapacite(100);
        UtilisateurRequest request = new UtilisateurRequest(
                "Observateur",
                "observateur@stockpro.local",
                "Observe123!",
                Role.OBSERVATEUR,
                entrepot.getId()
        );

        when(entrepotRepository.findById(entrepot.getId())).thenReturn(Optional.of(entrepot));
        when(passwordEncoder.encode(request.motDePasse())).thenReturn("encoded");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

        utilisateurService.create(request);

        verify(entrepotRepository).findById(entrepot.getId());
        verify(utilisateurRepository).save(any(Utilisateur.class));
    }
}
