package com.wassim.stock.config;

import com.wassim.stock.config.properties.StockProProperties;
import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.entity.Role;
import com.wassim.stock.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UtilisateurService utilisateurService;
    private final StockProProperties properties;

    @Bean
    public CommandLineRunner seedUtilisateurs() {
        return args -> {
            StockProProperties.Seed seed = properties.seed();
            utilisateurService.seedUtilisateur(
                    new UtilisateurRequest(seed.admin().nom(), seed.admin().email(), seed.admin().password(), Role.ADMIN, null)
            );
            utilisateurService.seedUtilisateur(
                    new UtilisateurRequest(seed.gestionnaire().nom(), seed.gestionnaire().email(), seed.gestionnaire().password(), Role.GESTIONNAIRE, "Entrepot principal")
            );
            utilisateurService.seedUtilisateur(
                    new UtilisateurRequest(seed.observateur().nom(), seed.observateur().email(), seed.observateur().password(), Role.OBSERVATEUR, "Entrepot principal")
            );
        };
    }
}
