package com.wassim.stock.dto.response;

public record AuthSession(
        String token,
        UtilisateurResponse utilisateur
) {
}
