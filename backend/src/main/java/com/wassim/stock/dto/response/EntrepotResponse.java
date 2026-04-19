package com.wassim.stock.dto.response;

public record EntrepotResponse(
        Long id,
        String nom,
        String adresse,
        Integer capacite
) {
}
