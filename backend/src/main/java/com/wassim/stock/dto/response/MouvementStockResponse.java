package com.wassim.stock.dto.response;

import com.wassim.stock.entity.TypeMouvement;

import java.time.LocalDateTime;

public record MouvementStockResponse(
        Long id,
        Long produitId,
        String produitNom,
        Long entrepotId,
        String entrepotNom,
        TypeMouvement type,
        Integer quantite,
        LocalDateTime date
) {
}
