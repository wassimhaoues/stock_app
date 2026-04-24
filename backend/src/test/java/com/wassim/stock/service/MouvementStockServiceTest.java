package com.wassim.stock.service;

import com.wassim.stock.dto.request.MouvementStockRequest;
import com.wassim.stock.dto.response.MouvementStockResponse;
import com.wassim.stock.dto.response.PagedResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.MouvementStock;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.TypeMouvement;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.ConflictException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MouvementStockServiceTest {

    @Mock
    private MouvementStockRepository mouvementStockRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private ProduitRepository produitRepository;

    @Mock
    private EntrepotRepository entrepotRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private MouvementStockService mouvementStockService;

    @BeforeEach
    void setUp() {
        mouvementStockService = new MouvementStockService(
                mouvementStockRepository,
                stockRepository,
                produitRepository,
                entrepotRepository,
                utilisateurRepository,
                new SimpleMeterRegistry()
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createSortieRejectsQuantityGreaterThanAvailableStock() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Stock stock = stock(3L, laptop, tunis, 4, 2);
        Utilisateur admin = utilisateur("admin@stockpro.local", Role.ADMIN, null);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));
        when(entrepotRepository.findById(tunis.getId())).thenReturn(Optional.of(tunis));
        when(stockRepository.findByProduitIdAndEntrepotId(laptop.getId(), tunis.getId())).thenReturn(Optional.of(stock));

        MouvementStockRequest request = new MouvementStockRequest(
                laptop.getId(),
                tunis.getId(),
                TypeMouvement.SORTIE,
                5
        );

        assertThatThrownBy(() -> mouvementStockService.create(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Stock insuffisant");
        verify(stockRepository, never()).save(any());
        verify(mouvementStockRepository, never()).save(any());
    }

    @Test
    void createEntreeRejectsQuantityAboveWarehouseCapacity() {
        Entrepot tunis = entrepot(1L, "Tunis", 10);
        Produit laptop = produit(2L, "Laptop");
        Stock stock = stock(3L, laptop, tunis, 8, 2);
        Utilisateur admin = utilisateur("admin@stockpro.local", Role.ADMIN, null);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));
        when(entrepotRepository.findById(tunis.getId())).thenReturn(Optional.of(tunis));
        when(stockRepository.findByProduitIdAndEntrepotId(laptop.getId(), tunis.getId())).thenReturn(Optional.of(stock));
        when(stockRepository.sumQuantiteByEntrepotId(tunis.getId())).thenReturn(8L);

        MouvementStockRequest request = new MouvementStockRequest(
                laptop.getId(),
                tunis.getId(),
                TypeMouvement.ENTREE,
                3
        );

        assertThatThrownBy(() -> mouvementStockService.create(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Capacite insuffisante");
        verify(stockRepository, never()).save(any());
        verify(mouvementStockRepository, never()).save(any());
    }

    @Test
    void createSortieDecreasesStockAndStoresMovement() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Stock stock = stock(3L, laptop, tunis, 10, 2);
        Utilisateur admin = utilisateur("admin@stockpro.local", Role.ADMIN, null);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));
        when(entrepotRepository.findById(tunis.getId())).thenReturn(Optional.of(tunis));
        when(stockRepository.findByProduitIdAndEntrepotId(laptop.getId(), tunis.getId())).thenReturn(Optional.of(stock));
        when(mouvementStockRepository.save(any(MouvementStock.class))).thenAnswer(invocation -> {
            MouvementStock saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        MouvementStockResponse response = mouvementStockService.create(new MouvementStockRequest(
                laptop.getId(),
                tunis.getId(),
                TypeMouvement.SORTIE,
                4
        ));

        assertThat(stock.getQuantite()).isEqualTo(6);
        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.type()).isEqualTo(TypeMouvement.SORTIE);
        assertThat(response.quantite()).isEqualTo(4);
        verify(stockRepository).save(stock);
    }

    @Test
    void findAllForAdminReturnsPagedMovementsSortedPage() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Utilisateur admin = utilisateur("admin@stockpro.local", Role.ADMIN, null);
        MouvementStock mouvement = new MouvementStock();
        mouvement.setId(11L);
        mouvement.setProduit(laptop);
        mouvement.setEntrepot(tunis);
        mouvement.setType(TypeMouvement.ENTREE);
        mouvement.setQuantite(3);
        mouvement.setDate(java.time.LocalDateTime.parse("2026-04-24T09:15:00"));
        PageRequest pageable = PageRequest.of(0, 20);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(mouvementStockRepository.findAll(pageable))
                .thenReturn(new PageImpl<>(List.of(mouvement), pageable, 1));

        PagedResponse<MouvementStockResponse> response = mouvementStockService.findAll(pageable);

        assertThat(response.content()).hasSize(1);
        assertThat(response.content().get(0).id()).isEqualTo(11L);
        assertThat(response.totalPages()).isEqualTo(1);
        verify(mouvementStockRepository).findAll(pageable);
    }

    private void authenticateAs(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of())
        );
    }

    private Entrepot entrepot(Long id, String nom, int capacite) {
        Entrepot entrepot = new Entrepot();
        entrepot.setId(id);
        entrepot.setNom(nom);
        entrepot.setAdresse("Adresse " + nom);
        entrepot.setCapacite(capacite);
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
