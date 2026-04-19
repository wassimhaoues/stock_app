package com.wassim.stock.dto.request;

import com.wassim.stock.entity.TypeMouvement;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MouvementStockRequest(
        @NotNull(message = "Le produit est obligatoire")
        Long produitId,

        @NotNull(message = "L'entrepot est obligatoire")
        Long entrepotId,

        @NotNull(message = "Le type de mouvement est obligatoire")
        TypeMouvement type,

        @NotNull(message = "La quantite est obligatoire")
        @Min(value = 1, message = "La quantite doit etre superieure a 0")
        Integer quantite
) {
}
