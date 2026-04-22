package com.wassim.stock.config;

import com.wassim.stock.config.properties.StockProProperties;
import com.wassim.stock.dto.request.EntrepotRequest;
import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.MouvementStock;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.TypeMouvement;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.service.EntrepotService;
import com.wassim.stock.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private static final String CATEGORY_GAMING = "Gaming";
    private static final String SUPPLIER_SAMSUNG_TUNISIE = "Samsung Tunisie";

    private final EntrepotService entrepotService;
    private final MouvementStockRepository mouvementStockRepository;
    private final ProduitRepository produitRepository;
    private final StockRepository stockRepository;
    private final UtilisateurService utilisateurService;
    private final StockProProperties stockProProperties;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            seedAdminAccount();

            if (stockProProperties.demoData()) {
                seedDemoData();
            }
        };
    }

    private void seedAdminAccount() {
        utilisateurService.seedUtilisateur(
                new UtilisateurRequest(
                        stockProProperties.seed().admin().nom(),
                        stockProProperties.seed().admin().email(),
                        stockProProperties.seed().admin().password(),
                        Role.ADMIN,
                        null
                )
        );
    }

    private void seedDemoData() {
        Entrepot tunis = entrepotService.seedEntrepot(
                new EntrepotRequest("Entrepôt Tunis Charguia", "Zone industrielle Charguia 2, Tunis", 900)
        );
        Entrepot sfax = entrepotService.seedEntrepot(
                new EntrepotRequest("Entrepôt Sfax Poudrière", "Route de Gabès, Sfax", 700)
        );
        Entrepot sousse = entrepotService.seedEntrepot(
                new EntrepotRequest("Entrepôt Sousse Akouda", "Zone logistique Akouda, Sousse", 650)
        );
        Entrepot nabeul = entrepotService.seedEntrepot(
                new EntrepotRequest("Entrepôt Nabeul Mrezga", "Route touristique Mrezga, Nabeul", 420)
        );

        seedDemoUsers(tunis, sfax, sousse, nabeul);

        Produit msiThin = seedProduit(
                "Gamer MSI Thin 15 B13UCX i5 13è Gén 24G RTX 2050",
                CATEGORY_GAMING,
                "2499.00",
                "Tunisianet",
                6
        );
        Produit thinkPad = seedProduit(
                "Lenovo ThinkPad E14 i7 13è Gén 16G SSD 512G",
                "Informatique",
                "3290.00",
                "Scoop Informatique",
                8
        );
        Produit iphone = seedProduit(
                "Apple iPhone 15 128 Go Noir",
                "Téléphonie",
                "3899.00",
                "iStore Tunisie",
                8
        );
        Produit galaxy = seedProduit(
                "Samsung Galaxy A55 5G 256 Go Bleu",
                "Téléphonie",
                "1699.00",
                SUPPLIER_SAMSUNG_TUNISIE,
                12
        );
        Produit samsungTv = seedProduit(
                "TV Samsung Crystal UHD 55 pouces 4K",
                "TV",
                "2199.00",
                SUPPLIER_SAMSUNG_TUNISIE,
                5
        );
        Produit lgOled = seedProduit(
                "LG OLED C3 65 pouces 4K Smart TV",
                "TV",
                "5999.00",
                "LG Tunisie",
                3
        );
        Produit canon = seedProduit(
                "Canon EOS R50 Kit 18-45mm",
                "Photo",
                "2799.00",
                "CameraPro Tunisie",
                4
        );
        Produit sonyHeadset = seedProduit(
                "Sony WH-1000XM5 Noir",
                "Son",
                "1399.00",
                "Mytek",
                7
        );
        Produit jblPartyBox = seedProduit(
                "JBL PartyBox 310",
                "Son",
                "1899.00",
                "Tunisianet",
                6
        );
        Produit samsungWasher = seedProduit(
                "Lave-linge Samsung EcoBubble 9kg",
                "Électroménager",
                "1999.00",
                SUPPLIER_SAMSUNG_TUNISIE,
                4
        );
        Produit lgFridge = seedProduit(
                "Réfrigérateur LG No Frost 384L",
                "Électroménager",
                "2490.00",
                "LG Tunisie",
                4
        );
        Produit hpPrinter = seedProduit(
                "HP LaserJet Pro M404dn",
                "Informatique",
                "899.00",
                "Mytek",
                10
        );
        Produit ps5 = seedProduit(
                "PlayStation 5 Slim Standard",
                CATEGORY_GAMING,
                "2599.00",
                "GamesZone Tunisie",
                5
        );
        Produit switchOled = seedProduit(
                "Nintendo Switch OLED Neon",
                CATEGORY_GAMING,
                "1690.00",
                "GamesZone Tunisie",
                6
        );

        seedStocksAndMovements(tunis, msiThin, 35, 6);
        seedStocksAndMovements(tunis, thinkPad, 48, 8);
        seedStocksAndMovements(tunis, iphone, 25, 8);
        seedStocksAndMovements(tunis, galaxy, 18, 12);
        seedStocksAndMovements(tunis, ps5, 12, 5);
        seedStocksAndMovements(tunis, sonyHeadset, 18, 7);

        seedStocksAndMovements(sfax, galaxy, 28, 12);
        seedStocksAndMovements(sfax, samsungTv, 20, 5);
        seedStocksAndMovements(sfax, lgOled, 8, 3);
        seedStocksAndMovements(sfax, jblPartyBox, 15, 6);
        seedStocksAndMovements(sfax, samsungWasher, 12, 4);

        seedStocksAndMovements(sousse, canon, 18, 4);
        seedStocksAndMovements(sousse, switchOled, 22, 6);
        seedStocksAndMovements(sousse, hpPrinter, 30, 10);
        seedStocksAndMovements(sousse, lgFridge, 16, 4);
        seedStocksAndMovements(sousse, lgOled, 6, 3);

        seedStocksAndMovements(nabeul, iphone, 3, 8);
        seedStocksAndMovements(nabeul, ps5, 2, 5);
        seedStocksAndMovements(nabeul, jblPartyBox, 5, 6);
        seedStocksAndMovements(nabeul, galaxy, 10, 12);
    }

    private void seedDemoUsers(Entrepot tunis, Entrepot sfax, Entrepot sousse, Entrepot nabeul) {
        utilisateurService.seedUtilisateur(
                new UtilisateurRequest(
                        stockProProperties.seed().gestionnaire().nom(),
                        stockProProperties.seed().gestionnaire().email(),
                        stockProProperties.seed().gestionnaire().password(),
                        Role.GESTIONNAIRE,
                        tunis.getId()
                )
        );
        utilisateurService.seedUtilisateur(
                new UtilisateurRequest(
                        stockProProperties.seed().observateur().nom(),
                        stockProProperties.seed().observateur().email(),
                        stockProProperties.seed().observateur().password(),
                        Role.OBSERVATEUR,
                        tunis.getId()
                )
        );
        utilisateurService.seedUtilisateur(
                new UtilisateurRequest(
                        "Sarra Jlassi",
                        "gestionnaire.sfax@stockpro.local",
                        "Gestion123!",
                        Role.GESTIONNAIRE,
                        sfax.getId()
                )
        );
        utilisateurService.seedUtilisateur(
                new UtilisateurRequest(
                        "Mehdi Ayari",
                        "observateur.sousse@stockpro.local",
                        "Observe123!",
                        Role.OBSERVATEUR,
                        sousse.getId()
                )
        );
        utilisateurService.seedUtilisateur(
                new UtilisateurRequest(
                        "Nour Baccouche",
                        "gestionnaire.nabeul@stockpro.local",
                        "Gestion123!",
                        Role.GESTIONNAIRE,
                        nabeul.getId()
                )
        );
    }

    private Produit seedProduit(String nom, String categorie, String prix, String fournisseur, Integer seuilMin) {
        return produitRepository.findByNomIgnoreCase(nom)
                .orElseGet(() -> {
                    Produit produit = new Produit();
                    produit.setNom(nom);
                    produit.setCategorie(categorie);
                    produit.setPrix(new BigDecimal(prix));
                    produit.setFournisseur(fournisseur);
                    produit.setSeuilMin(seuilMin);
                    return produitRepository.save(produit);
                });
    }

    private void seedStocksAndMovements(Entrepot entrepot, Produit produit, Integer quantite, Integer seuilAlerte) {
        Stock stock = stockRepository.findByProduitIdAndEntrepotId(produit.getId(), entrepot.getId())
                .orElseGet(() -> {
                    Stock newStock = new Stock();
                    newStock.setProduit(produit);
                    newStock.setEntrepot(entrepot);
                    newStock.setQuantite(quantite);
                    newStock.setSeuilAlerte(seuilAlerte);
                    return stockRepository.save(newStock);
                });

        if (!mouvementStockRepository.existsByProduitIdAndEntrepotId(produit.getId(), entrepot.getId())) {
            seedMouvement(stock, TypeMouvement.ENTREE, Math.max(quantite + 8, 10), 6);
            seedMouvement(stock, TypeMouvement.SORTIE, Math.max(quantite / 3, 2), 3);
            seedMouvement(stock, TypeMouvement.ENTREE, Math.max(quantite / 2, 4), 1);
        }
    }

    private void seedMouvement(Stock stock, TypeMouvement type, Integer quantite, int daysAgo) {
        MouvementStock mouvementStock = new MouvementStock();
        mouvementStock.setProduit(stock.getProduit());
        mouvementStock.setEntrepot(stock.getEntrepot());
        mouvementStock.setType(type);
        mouvementStock.setQuantite(quantite);
        mouvementStock.setDate(LocalDateTime.now().minusDays(daysAgo).withSecond(0).withNano(0));
        mouvementStockRepository.save(mouvementStock);
    }
}
