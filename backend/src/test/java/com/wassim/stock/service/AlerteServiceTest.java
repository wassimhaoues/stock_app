package com.wassim.stock.service;

import com.wassim.stock.dto.response.AlerteResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.Utilisateur;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlerteServiceTest {

    @Mock
    private StockRepository stockRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @InjectMocks
    private AlerteService alerteService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void findAllKeepsOnlyStocksAtOrBelowThresholdAndOrdersCriticalFirst() {
        Entrepot tunis = entrepot(1L, "Tunis");
        Utilisateur admin = utilisateur("admin@stockpro.local", Role.ADMIN, null);
        Stock critical = stock(1L, produit(1L, "Camera"), tunis, 0, 5);
        Stock elevated = stock(2L, produit(2L, "Laptop"), tunis, 8, 10);
        Stock healthy = stock(3L, produit(3L, "Phone"), tunis, 11, 10);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(stockRepository.findAll()).thenReturn(List.of(elevated, healthy, critical));

        List<AlerteResponse> alertes = alerteService.findAll();

        assertThat(alertes).extracting(AlerteResponse::stockId).containsExactly(critical.getId(), elevated.getId());
        assertThat(alertes).extracting(AlerteResponse::priorite).containsExactly("CRITIQUE", "ELEVEE");
        assertThat(alertes.get(0).manque()).isEqualTo(5);
    }

    @Test
    void findAllForObservateurUsesAssignedWarehouseScope() {
        Entrepot tunis = entrepot(1L, "Tunis");
        Utilisateur observateur = utilisateur("observateur@stockpro.local", Role.OBSERVATEUR, tunis);
        Stock assignedStock = stock(1L, produit(1L, "Camera"), tunis, 2, 4);

        authenticateAs(observateur.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(observateur.getEmail())).thenReturn(Optional.of(observateur));
        when(stockRepository.findByEntrepotId(tunis.getId())).thenReturn(List.of(assignedStock));

        List<AlerteResponse> alertes = alerteService.findAll();

        assertThat(alertes).hasSize(1);
        assertThat(alertes.get(0).entrepotId()).isEqualTo(tunis.getId());
        verify(stockRepository, never()).findAll();
    }

    private void authenticateAs(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of())
        );
    }

    private Entrepot entrepot(Long id, String nom) {
        Entrepot entrepot = new Entrepot();
        entrepot.setId(id);
        entrepot.setNom(nom);
        entrepot.setAdresse("Adresse " + nom);
        entrepot.setCapacite(100);
        return entrepot;
    }

    private Produit produit(Long id, String nom) {
        Produit produit = new Produit();
        produit.setId(id);
        produit.setNom(nom);
        produit.setCategorie("Informatique");
        produit.setPrix(BigDecimal.valueOf(1200));
        produit.setFournisseur("Fournisseur");
        produit.setSeuilMin(2);
        return produit;
    }

    private Stock stock(Long id, Produit produit, Entrepot entrepot, int quantite, int seuilAlerte) {
        Stock stock = new Stock();
        stock.setId(id);
        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        stock.setQuantite(quantite);
        stock.setSeuilAlerte(seuilAlerte);
        return stock;
    }

    private Utilisateur utilisateur(String email, Role role, Entrepot entrepot) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(10L);
        utilisateur.setNom("Utilisateur");
        utilisateur.setEmail(email);
        utilisateur.setMotDePasse("encoded");
        utilisateur.setRole(role);
        utilisateur.setEntrepot(entrepot);
        return utilisateur;
    }
}
