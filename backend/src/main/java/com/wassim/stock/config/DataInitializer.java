package com.wassim.stock.config;

import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.entity.Role;
import com.wassim.stock.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UtilisateurService utilisateurService;

    @Value("${stockpro.seed.admin.nom}")
    private String adminNom;

    @Value("${stockpro.seed.admin.email}")
    private String adminEmail;

    @Value("${stockpro.seed.admin.password}")
    private String adminPassword;

    @Value("${stockpro.seed.gestionnaire.nom}")
    private String gestionnaireNom;

    @Value("${stockpro.seed.gestionnaire.email}")
    private String gestionnaireEmail;

    @Value("${stockpro.seed.gestionnaire.password}")
    private String gestionnairePassword;

    @Value("${stockpro.seed.observateur.nom}")
    private String observateurNom;

    @Value("${stockpro.seed.observateur.email}")
    private String observateurEmail;

    @Value("${stockpro.seed.observateur.password}")
    private String observateurPassword;

    @Bean
    public CommandLineRunner seedUtilisateurs() {
        return args -> {
            utilisateurService.seedUtilisateur(
                    new UtilisateurRequest(adminNom, adminEmail, adminPassword, Role.ADMIN, null)
            );
            utilisateurService.seedUtilisateur(
                    new UtilisateurRequest(gestionnaireNom, gestionnaireEmail, gestionnairePassword, Role.GESTIONNAIRE, "Entrepot principal")
            );
            utilisateurService.seedUtilisateur(
                    new UtilisateurRequest(observateurNom, observateurEmail, observateurPassword, Role.OBSERVATEUR, "Entrepot principal")
            );
        };
    }
}
