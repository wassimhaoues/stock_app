package com.wassim.stock.dto.response;

public record StockResponse(
        Long id,
        Long produitId,
        String produitNom,
        Long entrepotId,
        String entrepotNom,
        Integer quantite,
        Integer seuilAlerte,
        Boolean enAlerte
) {
}
