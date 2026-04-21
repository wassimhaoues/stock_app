package com.wassim.stock.service;

import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.dto.response.UtilisateurResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final EntrepotRepository entrepotRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UtilisateurResponse> findAll() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UtilisateurResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    public UtilisateurResponse create(UtilisateurRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (utilisateurRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("Un utilisateur avec cet email existe deja");
        }
        validatePasswordForCreate(request.motDePasse());
        validateAssignedEntrepot(request);

        Utilisateur utilisateur = new Utilisateur();
        applyRequest(utilisateur, request, true);
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public UtilisateurResponse update(Long id, UtilisateurRequest request) {
        Utilisateur utilisateur = findEntityById(id);
        validatePasswordForUpdate(request.motDePasse());
        validateAssignedEntrepot(request);
        String normalizedEmail = normalizeEmail(request.email());

        utilisateurRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Un utilisateur avec cet email existe deja");
                });

        applyRequest(utilisateur, request, false);
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public void delete(Long id) {
        Utilisateur utilisateur = findEntityById(id);
        utilisateurRepository.delete(utilisateur);
    }

    public void seedUtilisateur(UtilisateurRequest request) {
        validatePasswordForCreate(request.motDePasse());
        validateAssignedEntrepot(request);
        String normalizedEmail = normalizeEmail(request.email());

        utilisateurRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(existing -> {
            if (requiresEntrepot(existing.getRole()) && existing.getEntrepot() == null) {
                existing.setEntrepot(findEntrepotById(request.entrepotId()));
                utilisateurRepository.save(existing);
            }
        });

        if (utilisateurRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }

        Utilisateur utilisateur = new Utilisateur();
        applyRequest(utilisateur, request, true);
        utilisateurRepository.save(utilisateur);
    }

    private Utilisateur findEntityById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + id));
    }

    private void applyRequest(Utilisateur utilisateur, UtilisateurRequest request, boolean requirePassword) {
        utilisateur.setNom(request.nom().trim());
        utilisateur.setEmail(normalizeEmail(request.email()));
        utilisateur.setRole(request.role());
        utilisateur.setEntrepot(requiresEntrepot(request.role()) ? findEntrepotById(request.entrepotId()) : null);

        if (requirePassword || StringUtils.hasText(request.motDePasse())) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        }
    }

    private void validatePasswordForCreate(String motDePasse) {
        if (!StringUtils.hasText(motDePasse)) {
            throw new BadRequestException("Le mot de passe est obligatoire");
        }

        validatePasswordForUpdate(motDePasse);
    }

    private void validatePasswordForUpdate(String motDePasse) {
        if (StringUtils.hasText(motDePasse) && motDePasse.length() < 8) {
            throw new BadRequestException("Le mot de passe doit contenir au moins 8 caracteres");
        }
    }

    private void validateAssignedEntrepot(UtilisateurRequest request) {
        if (requiresEntrepot(request.role()) && request.entrepotId() == null) {
            throw new BadRequestException("Ce role doit etre affecte a un entrepot");
        }
    }

    private boolean requiresEntrepot(Role role) {
        return role == Role.GESTIONNAIRE || role == Role.OBSERVATEUR;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private Entrepot findEntrepotById(Long id) {
        return entrepotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entrepot introuvable : " + id));
    }

    private UtilisateurResponse toResponse(Utilisateur utilisateur) {
        Entrepot entrepot = utilisateur.getEntrepot();
        return new UtilisateurResponse(
                utilisateur.getId(),
                utilisateur.getNom(),
                utilisateur.getEmail(),
                utilisateur.getRole(),
                entrepot != null ? entrepot.getId() : null,
                entrepot != null ? entrepot.getNom() : null
        );
    }
}
