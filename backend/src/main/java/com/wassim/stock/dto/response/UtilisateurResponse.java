package com.wassim.stock.dto.response;

import com.wassim.stock.entity.Role;

public record UtilisateurResponse(
        Long id,
        String nom,
        String email,
        Role role,
        Long entrepotId,
        String entrepotNom
) {
}
