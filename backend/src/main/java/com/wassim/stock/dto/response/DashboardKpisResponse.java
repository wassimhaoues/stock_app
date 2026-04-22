package com.wassim.stock.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DashboardKpisResponse(
        BigDecimal valeurTotaleStock,
        Integer produitsActifs,
        Integer produitsSousSeuilCritique,
        Double tauxRisqueRupture,
        Integer entreesJour,
        Integer sortiesJour,
        Integer entreesSemaine,
        Integer sortiesSemaine,
        Integer entreesMois,
        Integer sortiesMois,
        Integer stocksDormants,
        Double couvertureStockJoursEstimee,
        List<WarehouseValueKpi> valeurStockParEntrepot,
        List<WarehouseCapacityKpi> capaciteParEntrepot
) {
    public record WarehouseValueKpi(
            Long entrepotId,
            String entrepotNom,
            BigDecimal valeurStock
    ) {
    }

    public record WarehouseCapacityKpi(
            Long entrepotId,
            String entrepotNom,
            Integer capacite,
            Integer capaciteUtilisee,
            Integer capaciteDisponible,
            Double tauxSaturation
    ) {
    }
}
