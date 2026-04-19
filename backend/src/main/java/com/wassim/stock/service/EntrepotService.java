package com.wassim.stock.service;

import com.wassim.stock.dto.request.EntrepotRequest;
import com.wassim.stock.dto.response.EntrepotResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EntrepotService {

    private final EntrepotRepository entrepotRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StockRepository stockRepository;
    private final MouvementStockRepository mouvementStockRepository;

    public List<EntrepotResponse> findAll() {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return entrepotRepository.findAll()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return List.of(toResponse(getAssignedEntrepot(currentUser)));
    }

    public EntrepotResponse findById(Long id) {
        Entrepot entrepot = findEntityById(id);
        Utilisateur currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN && !entrepot.getId().equals(getAssignedEntrepot(currentUser).getId())) {
            throw new ResourceNotFoundException("Entrepot introuvable : " + id);
        }

        return toResponse(entrepot);
    }

    public EntrepotResponse create(EntrepotRequest request) {
        validateUniqueName(request.nom(), null);

        Entrepot entrepot = new Entrepot();
        applyRequest(entrepot, request);
        return toResponse(entrepotRepository.save(entrepot));
    }

    public EntrepotResponse update(Long id, EntrepotRequest request) {
        Entrepot entrepot = findEntityById(id);
        validateUniqueName(request.nom(), id);
        applyRequest(entrepot, request);
        return toResponse(entrepotRepository.save(entrepot));
    }

    public void delete(Long id) {
        Entrepot entrepot = findEntityById(id);
        if (utilisateurRepository.existsByEntrepotId(id)) {
            throw new BadRequestException("Impossible de supprimer un entrepot affecte a un utilisateur");
        }
        if (stockRepository.existsByEntrepotId(id) || mouvementStockRepository.existsByEntrepotId(id)) {
            throw new BadRequestException("Impossible de supprimer un entrepot lie a des stocks ou mouvements");
        }

        entrepotRepository.delete(entrepot);
    }

    public Entrepot seedEntrepot(EntrepotRequest request) {
        return entrepotRepository.findByNomIgnoreCase(request.nom().trim())
                .orElseGet(() -> {
                    Entrepot entrepot = new Entrepot();
                    applyRequest(entrepot, request);
                    return entrepotRepository.save(entrepot);
                });
    }

    public Entrepot findEntityById(Long id) {
        return entrepotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrepot introuvable : " + id));
    }

    private void applyRequest(Entrepot entrepot, EntrepotRequest request) {
        entrepot.setNom(request.nom().trim());
        entrepot.setAdresse(request.adresse().trim());
        entrepot.setCapacite(request.capacite());
    }

    private void validateUniqueName(String nom, Long currentId) {
        entrepotRepository.findByNomIgnoreCase(nom.trim())
                .filter(existing -> currentId == null || !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new BadRequestException("Un entrepot avec ce nom existe deja");
                });
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

    private EntrepotResponse toResponse(Entrepot entrepot) {
        return new EntrepotResponse(
                entrepot.getId(),
                entrepot.getNom(),
                entrepot.getAdresse(),
                entrepot.getCapacite()
        );
    }
}
