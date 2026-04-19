package com.wassim.stock.dto.response;

import java.math.BigDecimal;

public record ProduitResponse(
        Long id,
        String nom,
        String categorie,
        BigDecimal prix,
        String fournisseur,
        Integer seuilMin
) {
}
