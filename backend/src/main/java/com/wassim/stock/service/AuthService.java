package com.wassim.stock.service;

import com.wassim.stock.dto.request.LoginRequest;
import com.wassim.stock.dto.response.AuthResponse;
import com.wassim.stock.dto.response.UtilisateurResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.repository.UtilisateurRepository;
import com.wassim.stock.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtUtil jwtUtil;

    public LoginResult login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.motDePasse())
            );
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Email ou mot de passe invalide");
        }

        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe invalide"));

        String token = jwtUtil.generateToken(utilisateur.getEmail(), utilisateur.getRole().name());

        return new LoginResult(token, new AuthResponse(toResponse(utilisateur)));
    }

    public UtilisateurResponse currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadCredentialsException("Authentification requise");
        }

        String email = normalizeEmail(authentication.getName());
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccessDeniedException("Utilisateur introuvable"));
        return toResponse(utilisateur);
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

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public record LoginResult(String token, AuthResponse response) {
    }
}
