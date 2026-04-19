package com.wassim.stock.controller;

import com.wassim.stock.dto.request.LoginRequest;
import com.wassim.stock.dto.response.AuthResponse;
import com.wassim.stock.dto.response.AuthSession;
import com.wassim.stock.security.JwtCookieService;
import com.wassim.stock.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtCookieService jwtCookieService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthSession session = authService.login(request);

        return ResponseEntity
                .ok()
                .headers(jwtCookieService.headersWithAuthCookie(session.token()))
                .body(new AuthResponse(session.utilisateur()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity
                .noContent()
                .headers(jwtCookieService.headersWithClearedAuthCookie())
                .build();
    }
}
