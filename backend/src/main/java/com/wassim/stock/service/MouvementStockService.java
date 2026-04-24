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
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ConflictException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class MouvementStockService {

    private final MouvementStockRepository mouvementStockRepository;
    private final StockRepository stockRepository;
    private final ProduitRepository produitRepository;
    private final EntrepotRepository entrepotRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MeterRegistry meterRegistry;

    public PagedResponse<MouvementStockResponse> findAll(Pageable pageable) {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return PagedResponse.from(mouvementStockRepository.findAll(pageable).map(this::toResponse));
        }

        return PagedResponse.from(
                mouvementStockRepository.findByEntrepotId(getAssignedEntrepot(currentUser).getId(), pageable)
                        .map(this::toResponse)
        );
    }

    public MouvementStockResponse findById(Long id) {
        MouvementStock mouvementStock = mouvementStockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mouvement stock introuvable : " + id));
        validateReadable(mouvementStock);
        return toResponse(mouvementStock);
    }

    @Transactional
    public MouvementStockResponse create(MouvementStockRequest request) {
        Produit produit = findProduitById(request.produitId());
        Entrepot entrepot = resolveWritableEntrepot(request.entrepotId());
        Stock stock = stockRepository.findByProduitIdAndEntrepotId(produit.getId(), entrepot.getId())
                .orElseThrow(() -> new BadRequestException("Aucun stock n'existe pour ce produit dans cet entrepot"));

        if (request.type() == TypeMouvement.SORTIE && stock.getQuantite() < request.quantite()) {
            log.warn(
                    "Mouvement SORTIE refuse : stock insuffisant (disponible={}, demande={})",
                    stock.getQuantite(),
                    request.quantite()
            );
            meterRegistry.counter("stockpro.mouvements.rejets", "raison", "stock_insuffisant").increment();
            throw new ConflictException("Stock insuffisant pour effectuer cette sortie");
        }

        if (request.type() == TypeMouvement.ENTREE) {
            validateCapacityForEntry(entrepot, request.quantite());
            stock.setQuantite(stock.getQuantite() + request.quantite());
        } else {
            stock.setQuantite(stock.getQuantite() - request.quantite());
        }
        stockRepository.save(stock);

        MouvementStock mouvementStock = new MouvementStock();
        mouvementStock.setProduit(produit);
        mouvementStock.setEntrepot(entrepot);
        mouvementStock.setType(request.type());
        mouvementStock.setQuantite(request.quantite());
        mouvementStock.setDate(LocalDateTime.now());
        MouvementStock savedMouvement = mouvementStockRepository.save(mouvementStock);
        log.info(
                "Mouvement {} enregistre : produit={}, entrepot={}, quantite={}",
                request.type(),
                produit.getId(),
                entrepot.getId(),
                request.quantite()
        );
        meterRegistry.counter("stockpro.mouvements.total", "type", request.type().name()).increment();
        return toResponse(savedMouvement);
    }

    private Produit findProduitById(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + id));
    }

    private Entrepot findEntrepotById(Long id) {
        return entrepotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrepot introuvable : " + id));
    }

    private void validateCapacityForEntry(Entrepot entrepot, Integer requestedQuantity) {
        long usedCapacity = getUsedCapacity(entrepot.getId());
        long finalCapacity = usedCapacity + requestedQuantity;

        if (finalCapacity > entrepot.getCapacite()) {
            long availableCapacity = Math.max(entrepot.getCapacite() - usedCapacity, 0);
            log.warn(
                    "Mouvement ENTREE refuse : capacite insuffisante (disponible={}, demande={})",
                    availableCapacity,
                    requestedQuantity
            );
            meterRegistry.counter("stockpro.mouvements.rejets", "raison", "capacite_depassee").increment();
            throw new ConflictException(
                    "Capacite insuffisante pour cet entrepot. Capacite disponible : "
                            + availableCapacity
                            + ", quantite demandee : "
                            + requestedQuantity
            );
        }
    }

    private long getUsedCapacity(Long entrepotId) {
        Long usedCapacity = stockRepository.sumQuantiteByEntrepotId(entrepotId);
        return usedCapacity == null ? 0 : usedCapacity;
    }

    private void validateReadable(MouvementStock mouvementStock) {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN
                && !mouvementStock.getEntrepot().getId().equals(getAssignedEntrepot(currentUser).getId())) {
            throw new ResourceNotFoundException("Mouvement stock introuvable : " + mouvementStock.getId());
        }
    }

    private Entrepot resolveWritableEntrepot(Long requestedEntrepotId) {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return findEntrepotById(requestedEntrepotId);
        }

        Entrepot assignedEntrepot = getAssignedEntrepot(currentUser);
        if (!assignedEntrepot.getId().equals(requestedEntrepotId)) {
            throw new AccessDeniedException("Acces refuse");
        }

        return assignedEntrepot;
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

    private MouvementStockResponse toResponse(MouvementStock mouvementStock) {
        return new MouvementStockResponse(
                mouvementStock.getId(),
                mouvementStock.getProduit().getId(),
                mouvementStock.getProduit().getNom(),
                mouvementStock.getEntrepot().getId(),
                mouvementStock.getEntrepot().getNom(),
                mouvementStock.getType(),
                mouvementStock.getQuantite(),
                mouvementStock.getDate()
        );
    }
}
