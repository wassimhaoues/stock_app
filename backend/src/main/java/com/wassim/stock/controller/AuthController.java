package com.wassim.stock.controller;

import com.wassim.stock.config.properties.AuthCookieProperties;
import com.wassim.stock.config.properties.JwtProperties;
import com.wassim.stock.dto.request.LoginRequest;
import com.wassim.stock.dto.response.AuthResponse;
import com.wassim.stock.dto.response.UtilisateurResponse;
import com.wassim.stock.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProperties jwtProperties;
    private final AuthCookieProperties authCookieProperties;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createAuthCookie(result.token()).toString())
                .body(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearAuthCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UtilisateurResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication));
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    private ResponseCookie createAuthCookie(String token) {
        return baseCookie(token)
                .maxAge(Duration.ofMillis(jwtProperties.expiration()))
                .build();
    }

    private ResponseCookie clearAuthCookie() {
        return baseCookie("")
                .maxAge(Duration.ZERO)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(authCookieProperties.name(), value)
                .httpOnly(true)
                .secure(authCookieProperties.secure())
                .sameSite(authCookieProperties.sameSite())
                .path(authCookieProperties.path());
    }
}
