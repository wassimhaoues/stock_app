package com.wassim.stock.controller;

import com.wassim.stock.dto.request.LoginRequest;
import com.wassim.stock.dto.request.MouvementStockRequest;
import com.wassim.stock.dto.request.StockRequest;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.TypeMouvement;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BackendSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EntrepotRepository entrepotRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private StockRepository stockRepository;

    @Test
    void loginWithSeededAdminSetsAuthCookieAndReturnsUserRole() throws Exception {
        LoginRequest request = new LoginRequest("admin@stockpro.local", "Admin123!");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", notNullValue()))
                .andExpect(header().string("X-RateLimit-Remaining", notNullValue()))
                .andExpect(header().string("Set-Cookie", containsString("STOCKPRO_AUTH=")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")))
                .andExpect(cookie().value("STOCKPRO_AUTH", notNullValue()))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.type").doesNotExist())
                .andExpect(jsonPath("$.utilisateur.email").value("admin@stockpro.local"))
                .andExpect(jsonPath("$.utilisateur.role").value("ADMIN"));
    }

    @Test
    void meReturnsCurrentUserFromAuthCookie() throws Exception {
        Cookie authCookie = loginAsAdmin();

        mockMvc.perform(get("/api/auth/me").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@stockpro.local"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void meWithoutAuthCookieReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentification requise"));
    }

    @Test
    void unsafeRequestWithAuthCookieRequiresCsrfToken() throws Exception {
        Cookie authCookie = loginAsAdmin();
        StockRequest request = new StockRequest(1L, 1L, 1, 1);

        mockMvc.perform(post("/api/stocks")
                        .cookie(authCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Acces refuse"));
    }

    @Test
    void logoutClearsAuthCookie() throws Exception {
        Cookie authCookie = loginAsAdmin();

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie)
                        .with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("STOCKPRO_AUTH=")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    void stocksEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/stocks"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Correlation-Id", notNullValue()))
                .andExpect(jsonPath("$.message").value("Authentification requise"));
    }

    @Test
    void healthEndpointExposesCorrelationIdHeader() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", notNullValue()))
                .andExpect(header().string("X-RateLimit-Remaining", notNullValue()))
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void loginIsRateLimitedAfterFiveRequestsFromSameIp() throws Exception {
        String ipAddress = "10.0.21.1";

        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                            .with(remoteAddr(ipAddress))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    new LoginRequest("admin@stockpro.local", "Admin123!")
                            )))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/auth/login")
                        .with(remoteAddr(ipAddress))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("admin@stockpro.local", "Admin123!")
                        )))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("X-RateLimit-Remaining", "0"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value("Trop de requêtes. Réessayez dans quelques secondes."));
    }

    @Test
    void genericApiRequestsAreRateLimitedAfterOneHundredTwentyRequestsFromSameIp() throws Exception {
        String ipAddress = "10.0.21.2";

        for (int attempt = 0; attempt < 120; attempt++) {
            mockMvc.perform(get("/api/health").with(remoteAddr(ipAddress)))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(get("/api/health").with(remoteAddr(ipAddress)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("X-RateLimit-Remaining", "0"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value("Trop de requêtes. Réessayez dans quelques secondes."));
    }

    @Test
    void observateurCannotCreateStock() throws Exception {
        StockRequest request = new StockRequest(1L, 1L, 1, 1);

        mockMvc.perform(post("/api/stocks")
                        .with(user("observateur@stockpro.local").roles("OBSERVATEUR"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void gestionnaireCannotBypassWarehouseScopeByChangingWarehouseId() throws Exception {
        Entrepot otherWarehouse = entrepotRepository.save(entrepot("Sfax", "Route de Sfax", 100));
        Produit product = produitRepository.save(produit("Laptop Pro"));
        StockRequest request = new StockRequest(product.getId(), otherWarehouse.getId(), 1, 1);

        mockMvc.perform(post("/api/stocks")
                        .with(user("gestionnaire@stockpro.local").roles("GESTIONNAIRE"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Acces refuse"));
    }

    @Test
    void stockCreationAboveWarehouseCapacityReturnsConflict() throws Exception {
        Entrepot warehouse = entrepotRepository.save(entrepot("Capacite limitee", "Tunis", 5));
        Produit existingProduct = produitRepository.save(produit("Produit existant"));
        Produit newProduct = produitRepository.save(produit("Produit nouveau"));
        stockRepository.save(stock(existingProduct, warehouse, 4, 1));
        StockRequest request = new StockRequest(newProduct.getId(), warehouse.getId(), 2, 1);

        mockMvc.perform(post("/api/stocks")
                        .with(user("admin@stockpro.local").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Capacite insuffisante")));
    }

    @Test
    void sortieAboveAvailableStockReturnsConflict() throws Exception {
        Entrepot warehouse = entrepotRepository.save(entrepot("Sortie limitee", "Tunis", 20));
        Produit product = produitRepository.save(produit("Produit sortie"));
        stockRepository.save(stock(product, warehouse, 3, 1));
        MouvementStockRequest request = new MouvementStockRequest(
                product.getId(),
                warehouse.getId(),
                TypeMouvement.SORTIE,
                4
        );

        mockMvc.perform(post("/api/mouvements-stock")
                        .with(user("admin@stockpro.local").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Stock insuffisant")));
    }

    @Test
    void gestionnaireSeesOnlyAssignedWarehouseStocks() throws Exception {
        Entrepot otherWarehouse = entrepotRepository.save(entrepot("Autre depot", "Sousse", 100));
        Produit product = produitRepository.save(produit("Produit scoped"));
        stockRepository.save(stock(product, otherWarehouse, 2, 1));

        mockMvc.perform(get("/api/stocks")
                        .with(user("gestionnaire@stockpro.local").roles("GESTIONNAIRE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].entrepotNom", not(hasItem("Autre depot"))));
    }

    @Test
    void stocksPageDataLoadsWithoutLazyInitializationError() throws Exception {
        mockMvc.perform(get("/api/stocks")
                        .with(user("admin@stockpro.local").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].produitNom").isNotEmpty())
                .andExpect(jsonPath("$.content[0].entrepotNom").isNotEmpty());

        mockMvc.perform(get("/api/mouvements-stock")
                        .with(user("admin@stockpro.local").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].produitNom").isNotEmpty())
                .andExpect(jsonPath("$.content[0].entrepotNom").isNotEmpty());
    }

    private Entrepot entrepot(String nom, String adresse, int capacite) {
        Entrepot entrepot = new Entrepot();
        entrepot.setNom(nom);
        entrepot.setAdresse(adresse);
        entrepot.setCapacite(capacite);
        return entrepot;
    }

    private Produit produit(String nom) {
        Produit produit = new Produit();
        produit.setNom(nom);
        produit.setCategorie("Informatique");
        produit.setPrix(BigDecimal.valueOf(1000));
        produit.setFournisseur("Fournisseur");
        produit.setSeuilMin(1);
        return produit;
    }

    private Stock stock(Produit produit, Entrepot entrepot, int quantite, int seuilAlerte) {
        Stock stock = new Stock();
        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        stock.setQuantite(quantite);
        stock.setSeuilAlerte(seuilAlerte);
        return stock;
    }

    private Cookie loginAsAdmin() throws Exception {
        LoginRequest request = new LoginRequest("admin@stockpro.local", "Admin123!");
        Cookie authCookie = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getCookie("STOCKPRO_AUTH");

        assertNotNull(authCookie, "Login did not return STOCKPRO_AUTH cookie");
        return authCookie;
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor remoteAddr(String ipAddress) {
        return request -> {
            request.setRemoteAddr(ipAddress);
            return request;
        };
    }
}
