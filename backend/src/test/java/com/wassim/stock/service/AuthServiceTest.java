package com.wassim.stock.service;

import com.wassim.stock.dto.request.LoginRequest;
import com.wassim.stock.dto.response.UtilisateurResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.repository.UtilisateurRepository;
import com.wassim.stock.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks private AuthService authService;

    @Test
    void loginThrowsOnBadCredentials() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("wrong@mail.com", "bad")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("invalide");
    }

    @Test
    void loginReturnsTokenAndUserOnSuccess() {
        Utilisateur user = utilisateur(1L, "admin@stockpro.local", Role.ADMIN, null);
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("admin@stockpro.local", "ADMIN")).thenReturn("jwt-token");

        AuthService.LoginResult result = authService.login(new LoginRequest("admin@stockpro.local", "pass"));

        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.response().utilisateur().email()).isEqualTo("admin@stockpro.local");
    }

    @Test
    void loginNormalizesEmail() {
        Utilisateur user = utilisateur(1L, "admin@stockpro.local", Role.ADMIN, null);
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(), any())).thenReturn("token");

        authService.login(new LoginRequest("  ADMIN@StockPro.local  ", "pass"));

        verify(utilisateurRepository).findByEmailIgnoreCase("admin@stockpro.local");
    }

    @Test
    void currentUserThrowsWhenAuthenticationIsNull() {
        assertThatThrownBy(() -> authService.currentUser(null))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Authentification requise");
    }

    @Test
    void currentUserThrowsWhenNotAuthenticated() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(false);

        assertThatThrownBy(() -> authService.currentUser(auth))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void currentUserReturnsResponseWithEntrepotWhenAuthenticated() {
        Entrepot entrepot = new Entrepot();
        entrepot.setId(1L);
        entrepot.setNom("Tunis");
        Utilisateur user = utilisateur(1L, "admin@stockpro.local", Role.ADMIN, entrepot);
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("admin@stockpro.local");
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local")).thenReturn(Optional.of(user));

        UtilisateurResponse response = authService.currentUser(auth);

        assertThat(response.email()).isEqualTo("admin@stockpro.local");
        assertThat(response.entrepotId()).isEqualTo(1L);
        assertThat(response.entrepotNom()).isEqualTo("Tunis");
    }

    @Test
    void currentUserHandlesNullEntrepot() {
        Utilisateur user = utilisateur(2L, "admin@stockpro.local", Role.ADMIN, null);
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("admin@stockpro.local");
        when(utilisateurRepository.findByEmailIgnoreCase("admin@stockpro.local")).thenReturn(Optional.of(user));

        UtilisateurResponse response = authService.currentUser(auth);

        assertThat(response.entrepotId()).isNull();
        assertThat(response.entrepotNom()).isNull();
    }

    private Utilisateur utilisateur(Long id, String email, Role role, Entrepot entrepot) {
        Utilisateur u = new Utilisateur();
        u.setId(id);
        u.setNom("Admin");
        u.setEmail(email);
        u.setMotDePasse("encoded");
        u.setRole(role);
        u.setEntrepot(entrepot);
        return u;
    }
}
