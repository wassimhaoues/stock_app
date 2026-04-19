package com.wassim.stock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockRequest(
        @NotNull(message = "Le produit est obligatoire")
        Long produitId,

        @NotNull(message = "L'entrepot est obligatoire")
        Long entrepotId,

        @NotNull(message = "La quantite est obligatoire")
        @Min(value = 0, message = "La quantite ne peut pas etre negative")
        Integer quantite,

        @NotNull(message = "Le seuil d'alerte est obligatoire")
        @Min(value = 0, message = "Le seuil d'alerte ne peut pas etre negatif")
        Integer seuilAlerte
) {
}
