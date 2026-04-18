package com.wassim.stock.dto.response;

public record AuthResponse(
        String token,
        String type,
        UtilisateurResponse utilisateur
) {
}
