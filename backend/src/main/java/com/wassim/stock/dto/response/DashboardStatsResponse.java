package com.wassim.stock.dto.response;

import java.math.BigDecimal;

public record DashboardStatsResponse(
        Long totalEntrepots,
        Long totalProduitsCatalogue,
        Long totalStocks,
        Long totalMouvements,
        BigDecimal valeurTotaleStock,
        Integer totalAlertes,
        Integer capaciteUtilisee,
        Integer capaciteDisponible,
        Double tauxSaturationGlobal
) {
}
