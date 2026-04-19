package com.wassim.stock.service;

import com.wassim.stock.dto.request.ProduitRequest;
import com.wassim.stock.dto.response.ProduitResponse;
import com.wassim.stock.entity.Produit;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProduitService {

    private final ProduitRepository produitRepository;

    public List<ProduitResponse> findAll() {
        return produitRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProduitResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    public ProduitResponse create(ProduitRequest request) {
        Produit produit = new Produit();
        applyRequest(produit, request);
        return toResponse(produitRepository.save(produit));
    }

    public ProduitResponse update(Long id, ProduitRequest request) {
        Produit produit = findEntityById(id);

        applyRequest(produit, request);
        return toResponse(produitRepository.save(produit));
    }

    public void delete(Long id) {
        Produit produit = findEntityById(id);
        produitRepository.delete(produit);
    }

    private Produit findEntityById(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + id));
    }

    private void applyRequest(Produit produit, ProduitRequest request) {
        produit.setNom(request.nom().trim());
        produit.setCategorie(request.categorie().trim());
        produit.setPrix(request.prix());
        produit.setFournisseur(request.fournisseur().trim());
        produit.setSeuilMin(request.seuilMin());
    }

    private ProduitResponse toResponse(Produit produit) {
        return new ProduitResponse(
                produit.getId(),
                produit.getNom(),
                produit.getCategorie(),
                produit.getPrix(),
                produit.getFournisseur(),
                produit.getSeuilMin()
        );
    }
}
