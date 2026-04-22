package com.wassim.stock.service;

import com.wassim.stock.dto.response.AdminAnalyticsResponse;
import com.wassim.stock.dto.response.AlerteResponse;
import com.wassim.stock.dto.response.DashboardAnalyticsResponse;
import com.wassim.stock.dto.response.DashboardKpisResponse;
import com.wassim.stock.dto.response.DashboardStatsResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.MouvementStock;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.TypeMouvement;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-04-22T12:00:00Z"),
            ZoneOffset.UTC
    );

    @Mock
    private AlerteService alerteService;

    @Mock
    private EntrepotRepository entrepotRepository;

    @Mock
    private MouvementStockRepository mouvementStockRepository;

    @Mock
    private ProduitRepository produitRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private DashboardService dashboardService;

    private Entrepot tunis;
    private Entrepot sfax;
    private Produit laptop;
    private Produit phone;
    private Produit camera;
    private Stock laptopStock;
    private Stock phoneStock;
    private Stock dormantStock;
    private List<MouvementStock> mouvements;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(
                alerteService,
                entrepotRepository,
                mouvementStockRepository,
                produitRepository,
                stockRepository,
                utilisateurRepository,
                FIXED_CLOCK
        );

        tunis = entrepot(1L, "Tunis", 100);
        sfax = entrepot(2L, "Sfax", 20);
        laptop = produit(10L, "Laptop", "100.00");
        phone = produit(11L, "Phone", "50.00");
        camera = produit(12L, "Camera", "200.00");
        laptopStock = stock(100L, laptop, tunis, 10);
        phoneStock = stock(101L, phone, sfax, 15);
        dormantStock = stock(102L, camera, tunis, 7);
        mouvements = List.of(
                mouvement(201L, laptop, tunis, TypeMouvement.ENTREE, 6, LocalDateTime.of(2026, 4, 22, 8, 0)),
                mouvement(202L, phone, sfax, TypeMouvement.SORTIE, 4, LocalDateTime.of(2026, 4, 22, 9, 0)),
                mouvement(203L, laptop, tunis, TypeMouvement.SORTIE, 3, LocalDateTime.of(2026, 4, 20, 10, 0)),
                mouvement(204L, camera, tunis, TypeMouvement.ENTREE, 2, LocalDateTime.of(2026, 3, 1, 10, 0))
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getStatsForAdminComputesGlobalCapacityValueAndAlertCount() {
        authenticateAs("admin@stockpro.local");
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local"))
                .thenReturn(Optional.of(utilisateur("admin@stockpro.local", Role.ADMIN, null)));
        when(entrepotRepository.findAll()).thenReturn(List.of(tunis, sfax));
        when(stockRepository.findAll()).thenReturn(List.of(laptopStock, phoneStock, dormantStock));
        when(mouvementStockRepository.findAllByOrderByDateDesc()).thenReturn(mouvements);
        when(produitRepository.count()).thenReturn(3L);
        when(alerteService.findAll()).thenReturn(List.of(alerte(phoneStock)));

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.totalEntrepots()).isEqualTo(2);
        assertThat(stats.totalProduitsCatalogue()).isEqualTo(3);
        assertThat(stats.totalStocks()).isEqualTo(3);
        assertThat(stats.totalMouvements()).isEqualTo(4);
        assertThat(stats.valeurTotaleStock()).isEqualByComparingTo("3150.00");
        assertThat(stats.totalAlertes()).isEqualTo(1);
        assertThat(stats.capaciteUtilisee()).isEqualTo(32);
        assertThat(stats.capaciteDisponible()).isEqualTo(88);
        assertThat(stats.tauxSaturationGlobal()).isEqualTo(32 / 120.0);
    }

    @Test
    void getKpisComputesPeriodsRiskCoverageAndWarehouseSummaries() {
        authenticateAs("admin@stockpro.local");
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local"))
                .thenReturn(Optional.of(utilisateur("admin@stockpro.local", Role.ADMIN, null)));
        when(entrepotRepository.findAll()).thenReturn(List.of(tunis, sfax));
        when(stockRepository.findAll()).thenReturn(List.of(laptopStock, phoneStock, dormantStock));
        when(mouvementStockRepository.findAllByOrderByDateDesc()).thenReturn(mouvements);
        when(alerteService.findAll()).thenReturn(List.of(alerte(phoneStock)));

        DashboardKpisResponse kpis = dashboardService.getKpis();

        assertThat(kpis.valeurTotaleStock()).isEqualByComparingTo("3150.00");
        assertThat(kpis.produitsActifs()).isEqualTo(3);
        assertThat(kpis.produitsSousSeuilCritique()).isEqualTo(1);
        assertThat(kpis.tauxRisqueRupture()).isEqualTo(1 / 3.0);
        assertThat(kpis.entreesJour()).isEqualTo(6);
        assertThat(kpis.sortiesJour()).isEqualTo(4);
        assertThat(kpis.entreesSemaine()).isEqualTo(6);
        assertThat(kpis.sortiesSemaine()).isEqualTo(7);
        assertThat(kpis.entreesMois()).isEqualTo(6);
        assertThat(kpis.sortiesMois()).isEqualTo(7);
        assertThat(kpis.stocksDormants()).isEqualTo(1);
        assertThat(kpis.couvertureStockJoursEstimee()).isEqualTo(32 / (7 / 30.0));
        assertThat(kpis.valeurStockParEntrepot())
                .extracting(DashboardKpisResponse.WarehouseValueKpi::entrepotNom)
                .containsExactly("Tunis", "Sfax");
        assertThat(kpis.capaciteParEntrepot().get(0).entrepotNom()).isEqualTo("Sfax");
    }

    @Test
    void getAnalyticsBuildsTrendDistributionTopProductsDormantStocksAndAlertSeverity() {
        authenticateAs("admin@stockpro.local");
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local"))
                .thenReturn(Optional.of(utilisateur("admin@stockpro.local", Role.ADMIN, null)));
        when(entrepotRepository.findAll()).thenReturn(List.of(tunis, sfax));
        when(stockRepository.findAll()).thenReturn(List.of(laptopStock, phoneStock, dormantStock));
        when(mouvementStockRepository.findAllByOrderByDateDesc()).thenReturn(mouvements);
        when(alerteService.findAll()).thenReturn(List.of(alerte(phoneStock)));

        DashboardAnalyticsResponse analytics = dashboardService.getAnalytics();

        assertThat(analytics.mouvementsParJour()).hasSize(7);
        assertThat(analytics.mouvementsParJour())
                .filteredOn(point -> point.date().equals(LocalDate.of(2026, 4, 22)))
                .singleElement()
                .satisfies(point -> {
                    assertThat(point.entrees()).isEqualTo(6);
                    assertThat(point.sorties()).isEqualTo(4);
                });
        assertThat(analytics.repartitionParEntrepot())
                .extracting(DashboardAnalyticsResponse.WarehouseDistributionItem::entrepotNom)
                .containsExactly("Tunis", "Sfax");
        assertThat(analytics.topProduitsMouvementes().get(0).produitNom()).isEqualTo("Laptop");
        assertThat(analytics.stocksDormants())
                .extracting(DashboardAnalyticsResponse.DormantStockItem::produitNom)
                .containsExactly("Camera");
        assertThat(analytics.alertesParGravite())
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.priorite()).isEqualTo("CRITIQUE");
                    assertThat(item.total()).isEqualTo(1);
                });
        assertThat(analytics.entrepotsActifs().get(0).entrepotNom()).isEqualTo("Tunis");
    }

    @Test
    void getAdminAnalyticsRequiresAdminAndComputesWarehouseBenchmark() {
        authenticateAs("admin@stockpro.local");
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local"))
                .thenReturn(Optional.of(utilisateur("admin@stockpro.local", Role.ADMIN, null)));
        when(entrepotRepository.findAll()).thenReturn(List.of(tunis, sfax));
        when(stockRepository.findAll()).thenReturn(List.of(laptopStock, phoneStock, dormantStock));
        when(mouvementStockRepository.findAllByOrderByDateDesc()).thenReturn(mouvements);
        when(alerteService.findAll()).thenReturn(List.of(alerte(phoneStock)));

        AdminAnalyticsResponse adminAnalytics = dashboardService.getAdminAnalytics();

        assertThat(adminAnalytics.valeurMoyenneParEntrepot()).isEqualByComparingTo("1575.00");
        assertThat(adminAnalytics.entrepotsEnRisqueCapacite()).isEqualTo(0);
        assertThat(adminAnalytics.performanceEntrepots())
                .extracting(AdminAnalyticsResponse.WarehouseBenchmarkItem::entrepotNom)
                .containsExactly("Tunis", "Sfax");
        assertThat(adminAnalytics.performanceEntrepots().get(1).alertes()).isEqualTo(1);
    }

    @Test
    void nonAdminScopeUsesAssignedWarehouseAndCannotReadAdminAnalytics() {
        Utilisateur gestionnaire = utilisateur("gestionnaire@stockpro.local", Role.GESTIONNAIRE, tunis);
        authenticateAs(gestionnaire.getEmail());
        when(utilisateurRepository.findByEmailIgnoreCase(gestionnaire.getEmail()))
                .thenReturn(Optional.of(gestionnaire));
        when(stockRepository.findByEntrepotId(tunis.getId())).thenReturn(List.of(laptopStock, dormantStock));
        when(mouvementStockRepository.findByEntrepotIdOrderByDateDesc(tunis.getId()))
                .thenReturn(List.of(mouvements.get(0), mouvements.get(2), mouvements.get(3)));
        when(produitRepository.count()).thenReturn(3L);
        when(alerteService.findAll()).thenReturn(List.of());

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.totalEntrepots()).isEqualTo(1);
        assertThat(stats.totalStocks()).isEqualTo(2);
        assertThat(stats.totalMouvements()).isEqualTo(3);
        assertThat(stats.capaciteUtilisee()).isEqualTo(17);
        verify(entrepotRepository, never()).findAll();

        assertThatThrownBy(() -> dashboardService.getAdminAnalytics())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Acces refuse");
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

    private Produit produit(Long id, String nom, String prix) {
        Produit produit = new Produit();
        produit.setId(id);
        produit.setNom(nom);
        produit.setCategorie("Informatique");
        produit.setPrix(new BigDecimal(prix));
        produit.setFournisseur("Fournisseur");
        produit.setSeuilMin(2);
        return produit;
    }

    private Stock stock(Long id, Produit produit, Entrepot entrepot, int quantite) {
        Stock stock = new Stock();
        stock.setId(id);
        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        stock.setQuantite(quantite);
        stock.setSeuilAlerte(5);
        return stock;
    }

    private MouvementStock mouvement(
            Long id,
            Produit produit,
            Entrepot entrepot,
            TypeMouvement type,
            int quantite,
            LocalDateTime date
    ) {
        MouvementStock mouvement = new MouvementStock();
        mouvement.setId(id);
        mouvement.setProduit(produit);
        mouvement.setEntrepot(entrepot);
        mouvement.setType(type);
        mouvement.setQuantite(quantite);
        mouvement.setDate(date);
        return mouvement;
    }

    private Utilisateur utilisateur(String email, Role role, Entrepot entrepot) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(300L);
        utilisateur.setNom("Utilisateur");
        utilisateur.setEmail(email);
        utilisateur.setMotDePasse("encoded");
        utilisateur.setRole(role);
        utilisateur.setEntrepot(entrepot);
        return utilisateur;
    }

    private AlerteResponse alerte(Stock stock) {
        return new AlerteResponse(
                stock.getId(),
                stock.getProduit().getId(),
                stock.getProduit().getNom(),
                stock.getEntrepot().getId(),
                stock.getEntrepot().getNom(),
                stock.getQuantite(),
                stock.getSeuilAlerte(),
                0,
                "CRITIQUE",
                "Reapprovisionnement immediat"
        );
    }
}
