package com.wassim.stock.service;

import com.wassim.stock.dto.response.AlerteResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlerteService {

    private static final String PRIORITY_CRITICAL = "CRITIQUE";

    private final StockRepository stockRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<AlerteResponse> findAll() {
        return findScopedStocks()
                .stream()
                .filter(stock -> stock.getQuantite() <= stock.getSeuilAlerte())
                .sorted(Comparator
                        .comparing(this::priorityRank)
                        .thenComparing(stock -> stock.getProduit().getNom()))
                .map(this::toResponse)
                .toList();
    }

    private List<Stock> findScopedStocks() {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return stockRepository.findAll();
        }

        return stockRepository.findByEntrepotId(getAssignedEntrepot(currentUser).getId());
    }

    private int priorityRank(Stock stock) {
        return PRIORITY_CRITICAL.equals(resolvePriority(stock)) ? 0 : 1;
    }

    private AlerteResponse toResponse(Stock stock) {
        int manque = Math.max(stock.getSeuilAlerte() - stock.getQuantite(), 0);
        String priorite = resolvePriority(stock);
        return new AlerteResponse(
                stock.getId(),
                stock.getProduit().getId(),
                stock.getProduit().getNom(),
                stock.getEntrepot().getId(),
                stock.getEntrepot().getNom(),
                stock.getQuantite(),
                stock.getSeuilAlerte(),
                manque,
                priorite,
                resolveExpectedAction(priorite)
        );
    }

    private String resolvePriority(Stock stock) {
        if (stock.getQuantite() == 0 || stock.getQuantite() * 2 <= stock.getSeuilAlerte()) {
            return PRIORITY_CRITICAL;
        }

        return "ELEVEE";
    }

    private String resolveExpectedAction(String priorite) {
        if (PRIORITY_CRITICAL.equals(priorite)) {
            return "Reapprovisionnement immediat";
        }

        return "Planifier une entree de stock";
    }

    private Utilisateur getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return utilisateurRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Entrepot getAssignedEntrepot(Utilisateur utilisateur) {
        if (utilisateur.getEntrepot() == null) {
            throw new BadRequestException("Aucun entrepot n'est affecte a ce compte");
        }

        return utilisateur.getEntrepot();
    }
}
