package com.wassim.stock.dto.response;

public record AlerteResponse(
        Long stockId,
        Long produitId,
        String produitNom,
        Long entrepotId,
        String entrepotNom,
        Integer quantite,
        Integer seuilAlerte,
        Integer manque,
        String priorite,
        String actionAttendue
) {
}
