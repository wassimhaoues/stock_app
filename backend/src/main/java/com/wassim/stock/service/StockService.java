package com.wassim.stock.service;

import com.wassim.stock.dto.request.StockRequest;
import com.wassim.stock.dto.response.StockResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final ProduitRepository produitRepository;
    private final EntrepotRepository entrepotRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MouvementStockRepository mouvementStockRepository;

    public List<StockResponse> findAll() {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return stockRepository.findAll()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return stockRepository.findByEntrepotId(getAssignedEntrepot(currentUser).getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public StockResponse findById(Long id) {
        Stock stock = findEntityById(id);
        validateReadable(stock);
        return toResponse(stock);
    }

    public StockResponse create(StockRequest request) {
        Produit produit = findProduitById(request.produitId());
        Entrepot entrepot = resolveWritableEntrepot(request.entrepotId());
        validateUniqueStock(produit.getId(), entrepot.getId(), null);

        Stock stock = new Stock();
        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        applyQuantities(stock, request);

        return toResponse(stockRepository.save(stock));
    }

    public StockResponse update(Long id, StockRequest request) {
        Stock stock = findEntityById(id);
        validateWritable(stock);

        Produit produit = findProduitById(request.produitId());
        Entrepot entrepot = resolveWritableEntrepot(request.entrepotId());
        validateUniqueStock(produit.getId(), entrepot.getId(), id);

        stock.setProduit(produit);
        stock.setEntrepot(entrepot);
        applyQuantities(stock, request);

        return toResponse(stockRepository.save(stock));
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
        return utilisateurRepository.findByEmail(email)
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
