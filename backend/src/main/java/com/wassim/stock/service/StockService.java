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
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ConflictException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
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
public class StockService {

    private final StockRepository stockRepository;
    private final ProduitRepository produitRepository;
    private final EntrepotRepository entrepotRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MouvementStockRepository mouvementStockRepository;

    public PagedResponse<StockResponse> findAll(Pageable pageable) {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return PagedResponse.from(stockRepository.findAll(pageable).map(this::toResponse));
        }

        return PagedResponse.from(
                stockRepository.findByEntrepotId(getAssignedEntrepot(currentUser).getId(), pageable)
                        .map(this::toResponse)
        );
    }

    public StockResponse findById(Long id) {
        Stock stock = findEntityById(id);
        validateReadable(stock);
        return toResponse(stock);
    }

    @Transactional
    public StockResponse create(StockRequest request) {
        Produit produit = findProduitById(request.produitId());
        Entrepot entrepot = resolveWritableEntrepot(request.entrepotId());
        validateUniqueStock(produit.getId(), entrepot.getId(), null);
        validateCapacity(entrepot, request.quantite(), null);

        Stock stock = new Stock();
        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        applyQuantities(stock, request);
        Stock savedStock = stockRepository.save(stock);
        recordMovementIfNeeded(produit, entrepot, request.quantite());
        log.info(
                "Stock cree : produit={}, entrepot={}, quantite={}",
                produit.getId(),
                entrepot.getId(),
                request.quantite()
        );
        return toResponse(savedStock);
    }

    @Transactional
    public StockResponse update(Long id, StockRequest request) {
        Stock stock = findEntityById(id);
        validateWritable(stock);
        Produit previousProduit = stock.getProduit();
        Entrepot previousEntrepot = stock.getEntrepot();
        int previousQuantity = stock.getQuantite();

        Produit produit = findProduitById(request.produitId());
        Entrepot entrepot = resolveWritableEntrepot(request.entrepotId());
        validateUniqueStock(produit.getId(), entrepot.getId(), id);
        validateCapacity(entrepot, request.quantite(), id);

        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        applyQuantities(stock, request);
        Stock savedStock = stockRepository.save(stock);
        recordHistoryForUpdate(previousProduit, previousEntrepot, previousQuantity, produit, entrepot, request.quantite());
        log.info("Stock mis a jour : id={}, nouvelle quantite={}", savedStock.getId(), savedStock.getQuantite());
        return toResponse(savedStock);
    }

    public void delete(Long id) {
        Stock stock = findEntityById(id);
        validateWritable(stock);
        stockRepository.delete(stock);
    }

    public boolean existsByProduitId(Long produitId) {
        return stockRepository.existsByProduitId(produitId);
    }

    public boolean existsByEntrepotId(Long entrepotId) {
        return stockRepository.existsByEntrepotId(entrepotId);
    }

    public boolean existsMouvementByProduitId(Long produitId) {
        return mouvementStockRepository.existsByProduitId(produitId);
    }

    public boolean existsMouvementByEntrepotId(Long entrepotId) {
        return mouvementStockRepository.existsByEntrepotId(entrepotId);
    }

    private void applyQuantities(Stock stock, StockRequest request) {
        stock.setQuantite(request.quantite());
        stock.setSeuilAlerte(request.seuilAlerte());
    }

    private void recordHistoryForUpdate(Produit previousProduit,
                                        Entrepot previousEntrepot,
                                        int previousQuantity,
                                        Produit newProduit,
                                        Entrepot newEntrepot,
                                        int newQuantity) {
        boolean sameStockCoordinates = previousProduit.getId().equals(newProduit.getId())
                && previousEntrepot.getId().equals(newEntrepot.getId());

        if (sameStockCoordinates) {
            recordMovementIfNeeded(newProduit, newEntrepot, newQuantity - previousQuantity);
            return;
        }

        recordMovement(previousProduit, previousEntrepot, TypeMouvement.SORTIE, previousQuantity);
        recordMovement(newProduit, newEntrepot, TypeMouvement.ENTREE, newQuantity);
    }

    private Stock findEntityById(Long id) {
        return stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock introuvable : " + id));
    }

    private Produit findProduitById(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + id));
    }

    private Entrepot findEntrepotById(Long id) {
        return entrepotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrepot introuvable : " + id));
    }

    private void validateUniqueStock(Long produitId, Long entrepotId, Long currentId) {
        stockRepository.findByProduitIdAndEntrepotId(produitId, entrepotId)
                .filter(existing -> currentId == null || !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new BadRequestException("Ce produit existe deja dans cet entrepot");
                });
    }

    private void validateCapacity(Entrepot entrepot, Integer requestedQuantity, Long currentStockId) {
        long usedCapacity = currentStockId == null
                ? getUsedCapacity(entrepot.getId())
                : getUsedCapacityExcludingStock(entrepot.getId(), currentStockId);
        long finalCapacity = usedCapacity + requestedQuantity;

        if (finalCapacity > entrepot.getCapacite()) {
            long availableCapacity = Math.max(entrepot.getCapacite() - usedCapacity, 0);
            log.warn(
                    "Creation de stock refusee : capacite insuffisante (disponible={}, demande={})",
                    availableCapacity,
                    requestedQuantity
            );
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

    private long getUsedCapacityExcludingStock(Long entrepotId, Long stockId) {
        Long usedCapacity = stockRepository.sumQuantiteByEntrepotIdExcludingStock(entrepotId, stockId);
        return usedCapacity == null ? 0 : usedCapacity;
    }

    private void recordMovementIfNeeded(Produit produit, Entrepot entrepot, int quantityDelta) {
        if (quantityDelta > 0) {
            recordMovement(produit, entrepot, TypeMouvement.ENTREE, quantityDelta);
        } else if (quantityDelta < 0) {
            recordMovement(produit, entrepot, TypeMouvement.SORTIE, Math.abs(quantityDelta));
        }
    }

    private void recordMovement(Produit produit, Entrepot entrepot, TypeMouvement type, int quantite) {
        if (quantite <= 0) {
            return;
        }

        MouvementStock mouvementStock = new MouvementStock();
        mouvementStock.setProduit(produit);
        mouvementStock.setEntrepot(entrepot);
        mouvementStock.setType(type);
        mouvementStock.setQuantite(quantite);
        mouvementStock.setDate(LocalDateTime.now());
        mouvementStockRepository.save(mouvementStock);
    }

    private void validateReadable(Stock stock) {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN
                && !stock.getEntrepot().getId().equals(getAssignedEntrepot(currentUser).getId())) {
            throw new ResourceNotFoundException("Stock introuvable : " + stock.getId());
        }
    }

    private void validateWritable(Stock stock) {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN
                && !stock.getEntrepot().getId().equals(getAssignedEntrepot(currentUser).getId())) {
            throw new AccessDeniedException("Acces refuse");
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

    private StockResponse toResponse(Stock stock) {
        return new StockResponse(
                stock.getId(),
                stock.getProduit().getId(),
                stock.getProduit().getNom(),
                stock.getEntrepot().getId(),
                stock.getEntrepot().getNom(),
                stock.getQuantite(),
                stock.getSeuilAlerte(),
                stock.getQuantite() <= stock.getSeuilAlerte()
        );
    }
}
