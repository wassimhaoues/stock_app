package com.wassim.stock.service;

import com.wassim.stock.dto.request.UtilisateurRequest;
import com.wassim.stock.dto.response.UtilisateurResponse;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
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
        if (utilisateurRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Un utilisateur avec cet email existe deja");
        }

        Utilisateur utilisateur = new Utilisateur();
        applyRequest(utilisateur, request);
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public UtilisateurResponse update(Long id, UtilisateurRequest request) {
        Utilisateur utilisateur = findEntityById(id);

        utilisateurRepository.findByEmail(request.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Un utilisateur avec cet email existe deja");
                });

        applyRequest(utilisateur, request);
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public void delete(Long id) {
        Utilisateur utilisateur = findEntityById(id);
        utilisateurRepository.delete(utilisateur);
    }

    public void seedUtilisateur(UtilisateurRequest request) {
        if (utilisateurRepository.existsByEmail(request.email())) {
            return;
        }

        Utilisateur utilisateur = new Utilisateur();
        applyRequest(utilisateur, request);
        utilisateurRepository.save(utilisateur);
    }

    private Utilisateur findEntityById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + id));
    }

    private void applyRequest(Utilisateur utilisateur, UtilisateurRequest request) {
        utilisateur.setNom(request.nom());
        utilisateur.setEmail(request.email());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        utilisateur.setRole(request.role());
    }

    private UtilisateurResponse toResponse(Utilisateur utilisateur) {
        return new UtilisateurResponse(
                utilisateur.getId(),
                utilisateur.getNom(),
                utilisateur.getEmail(),
                utilisateur.getRole()
        );
    }
}
