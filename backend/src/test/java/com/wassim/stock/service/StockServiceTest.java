package com.wassim.stock.service;

import com.wassim.stock.dto.request.StockRequest;
import com.wassim.stock.dto.response.PagedResponse;
import com.wassim.stock.dto.response.StockResponse;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private StockRepository stockRepository;

    @Mock
    private ProduitRepository produitRepository;

    @Mock
    private EntrepotRepository entrepotRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private MouvementStockRepository mouvementStockRepository;

    @InjectMocks
    private StockService stockService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void findAllForGestionnaireReturnsOnlyAssignedWarehouseStocks() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Utilisateur gestionnaire = utilisateur(10L, "gestionnaire@stockpro.local", Role.GESTIONNAIRE, tunis);
        Stock assignedStock = stock(20L, produit(30L, "Laptop"), tunis, 12, 5);
        PageRequest pageable = PageRequest.of(0, 20);

        authenticateAs(gestionnaire.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(gestionnaire.getEmail())).thenReturn(Optional.of(gestionnaire));
        when(stockRepository.findByEntrepotId(tunis.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(assignedStock), pageable, 1));

        PagedResponse<StockResponse> response = stockService.findAll(pageable);

        assertThat(response.content()).hasSize(1);
        assertThat(response.content().get(0).entrepotId()).isEqualTo(tunis.getId());
        assertThat(response.page()).isEqualTo(0);
        assertThat(response.totalElements()).isEqualTo(1);
        verify(stockRepository, never()).findAll(pageable);
    }

    @Test
    void findAllForAdminForwardsPageableToRepository() {
        Utilisateur admin = utilisateur(1L, "admin@stockpro.local", Role.ADMIN, null);
        Stock existingStock = stock(20L, produit(30L, "Laptop"), entrepot(1L, "Tunis", 100), 12, 5);
        PageRequest pageable = PageRequest.of(1, 5);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(stockRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(existingStock), pageable, 6));

        PagedResponse<StockResponse> response = stockService.findAll(pageable);

        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(5);
        assertThat(response.totalElements()).isEqualTo(6);
        verify(stockRepository).findAll(pageable);
        verify(stockRepository, never()).findByEntrepotId(existingStock.getEntrepot().getId(), pageable);
    }

    @Test
    void createRejectsQuantityAboveWarehouseAvailableCapacity() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Utilisateur admin = utilisateur(3L, "admin@stockpro.local", Role.ADMIN, null);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));
        when(entrepotRepository.findById(tunis.getId())).thenReturn(Optional.of(tunis));
        when(stockRepository.findByProduitIdAndEntrepotId(laptop.getId(), tunis.getId())).thenReturn(Optional.empty());
        when(stockRepository.sumQuantiteByEntrepotId(tunis.getId())).thenReturn(95L);

        StockRequest request = new StockRequest(laptop.getId(), tunis.getId(), 10, 5);

        assertThatThrownBy(() -> stockService.create(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Capacite insuffisante");
        verify(stockRepository, never()).save(any());
    }

    @Test
    void createRejectsGestionnaireWhenWarehouseDoesNotMatchAssignment() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Utilisateur gestionnaire = utilisateur(3L, "gestionnaire@stockpro.local", Role.GESTIONNAIRE, tunis);

        authenticateAs(gestionnaire.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(gestionnaire.getEmail())).thenReturn(Optional.of(gestionnaire));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));

        StockRequest request = new StockRequest(laptop.getId(), 99L, 3, 5);

        assertThatThrownBy(() -> stockService.create(request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Acces refuse");
        verify(stockRepository, never()).save(any());
    }

    @Test
    void createReturnsAlertFlagWhenQuantityIsAtThreshold() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Utilisateur admin = utilisateur(3L, "admin@stockpro.local", Role.ADMIN, null);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));
        when(entrepotRepository.findById(tunis.getId())).thenReturn(Optional.of(tunis));
        when(stockRepository.findByProduitIdAndEntrepotId(laptop.getId(), tunis.getId())).thenReturn(Optional.empty());
        when(stockRepository.sumQuantiteByEntrepotId(tunis.getId())).thenReturn(0L);
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> {
            Stock saved = invocation.getArgument(0);
            saved.setId(50L);
            return saved;
        });

        StockResponse response = stockService.create(new StockRequest(laptop.getId(), tunis.getId(), 5, 5));

        assertThat(response.enAlerte()).isTrue();
        assertThat(response.quantite()).isEqualTo(5);
        assertThat(response.seuilAlerte()).isEqualTo(5);
        ArgumentCaptor<MouvementStock> movementCaptor = ArgumentCaptor.forClass(MouvementStock.class);
        verify(mouvementStockRepository).save(movementCaptor.capture());
        assertThat(movementCaptor.getValue().getType()).isEqualTo(TypeMouvement.ENTREE);
        assertThat(movementCaptor.getValue().getQuantite()).isEqualTo(5);
    }

    @Test
    void updateCreatesSortieHistoryWhenQuantityDecreases() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Produit laptop = produit(2L, "Laptop");
        Utilisateur admin = utilisateur(3L, "admin@stockpro.local", Role.ADMIN, null);
        Stock existingStock = stock(50L, laptop, tunis, 10, 5);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(stockRepository.findById(existingStock.getId())).thenReturn(Optional.of(existingStock));
        when(produitRepository.findById(laptop.getId())).thenReturn(Optional.of(laptop));
        when(entrepotRepository.findById(tunis.getId())).thenReturn(Optional.of(tunis));
        when(stockRepository.findByProduitIdAndEntrepotId(laptop.getId(), tunis.getId())).thenReturn(Optional.of(existingStock));
        when(stockRepository.sumQuantiteByEntrepotIdExcludingStock(tunis.getId(), existingStock.getId())).thenReturn(0L);
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockResponse response = stockService.update(existingStock.getId(), new StockRequest(laptop.getId(), tunis.getId(), 6, 5));

        assertThat(response.quantite()).isEqualTo(6);
        ArgumentCaptor<MouvementStock> movementCaptor = ArgumentCaptor.forClass(MouvementStock.class);
        verify(mouvementStockRepository).save(movementCaptor.capture());
        assertThat(movementCaptor.getValue().getType()).isEqualTo(TypeMouvement.SORTIE);
        assertThat(movementCaptor.getValue().getQuantite()).isEqualTo(4);
    }

    @Test
    void updateCreatesExitAndEntryHistoryWhenStockIsMoved() {
        Entrepot tunis = entrepot(1L, "Tunis", 100);
        Entrepot sfax = entrepot(2L, "Sfax", 100);
        Produit laptop = produit(2L, "Laptop");
        Produit phone = produit(3L, "Phone");
        Utilisateur admin = utilisateur(3L, "admin@stockpro.local", Role.ADMIN, null);
        Stock existingStock = stock(50L, laptop, tunis, 10, 5);

        authenticateAs(admin.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(stockRepository.findById(existingStock.getId())).thenReturn(Optional.of(existingStock));
        when(produitRepository.findById(phone.getId())).thenReturn(Optional.of(phone));
        when(entrepotRepository.findById(sfax.getId())).thenReturn(Optional.of(sfax));
        when(stockRepository.findByProduitIdAndEntrepotId(phone.getId(), sfax.getId())).thenReturn(Optional.empty());
        when(stockRepository.sumQuantiteByEntrepotIdExcludingStock(sfax.getId(), existingStock.getId())).thenReturn(0L);
        when(stockRepository.save(any(Stock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockResponse response = stockService.update(existingStock.getId(), new StockRequest(phone.getId(), sfax.getId(), 7, 3));

        assertThat(response.produitId()).isEqualTo(phone.getId());
        assertThat(response.entrepotId()).isEqualTo(sfax.getId());
        ArgumentCaptor<MouvementStock> movementCaptor = ArgumentCaptor.forClass(MouvementStock.class);
        verify(mouvementStockRepository, times(2)).save(movementCaptor.capture());
        assertThat(movementCaptor.getAllValues())
                .extracting(MouvementStock::getType, MouvementStock::getQuantite)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(TypeMouvement.SORTIE, 10),
                        org.assertj.core.groups.Tuple.tuple(TypeMouvement.ENTREE, 7)
                );
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

    private Utilisateur utilisateur(Long id, String email, Role role, Entrepot entrepot) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(id);
        utilisateur.setNom("Utilisateur");
        utilisateur.setEmail(email);
        utilisateur.setMotDePasse("encoded");
        utilisateur.setRole(role);
        utilisateur.setEntrepot(entrepot);
        return utilisateur;
    }
}
