package com.wassim.stock.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminAnalyticsResponse(
        BigDecimal valeurMoyenneParEntrepot,
        Integer entrepotsEnRisqueCapacite,
        List<WarehouseBenchmarkItem> performanceEntrepots
) {
    public record WarehouseBenchmarkItem(
            Long entrepotId,
            String entrepotNom,
            BigDecimal valeurStock,
            Integer mouvementsMois,
            Integer alertes,
            Double tauxSaturation
    ) {
    }
}
