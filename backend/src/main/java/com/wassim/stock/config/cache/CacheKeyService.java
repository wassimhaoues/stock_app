package com.wassim.stock.config.cache;

import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component("cacheKeyService")
@RequiredArgsConstructor
public class CacheKeyService {

    private static final String ADMIN_KEY = "ADMIN";
    private static final String ANONYMOUS_KEY = "ANONYMOUS";
    private static final long UNASSIGNED_WAREHOUSE = -1L;

    private final UtilisateurRepository utilisateurRepository;

    public String entrepotsKey() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ANONYMOUS_KEY;
        }

        String email = authentication.getName();
        if (!StringUtils.hasText(email) || "anonymousUser".equalsIgnoreCase(email)) {
            return ANONYMOUS_KEY;
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(email)
                .orElse(null);
        if (utilisateur == null) {
            return email;
        }
        if (utilisateur.getRole() == Role.ADMIN) {
            return ADMIN_KEY;
        }

        long entrepotId = utilisateur.getEntrepot() == null ? UNASSIGNED_WAREHOUSE : utilisateur.getEntrepot().getId();
        return utilisateur.getRole().name() + ":" + entrepotId;
    }
}
