package com.wassim.stock.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardAnalyticsResponse(
        List<MovementTrendPoint> mouvementsParJour,
        List<WarehouseDistributionItem> repartitionParEntrepot,
        List<TopProductMovementItem> topProduitsMouvementes,
        List<DormantStockItem> stocksDormants,
        List<AlertSeverityItem> alertesParGravite,
        List<WarehouseActivityItem> entrepotsActifs
) {
    public record MovementTrendPoint(
            LocalDate date,
            Integer entrees,
            Integer sorties
    ) {
    }

    public record WarehouseDistributionItem(
            Long entrepotId,
            String entrepotNom,
            Integer quantiteStock,
            BigDecimal valeurStock,
            Integer alertes,
            Double tauxSaturation
    ) {
    }

    public record TopProductMovementItem(
            Long produitId,
            String produitNom,
            Integer quantiteMouvementee,
            BigDecimal valeurStock
    ) {
    }

    public record DormantStockItem(
            Long stockId,
            String produitNom,
            String entrepotNom,
            Integer quantite,
            Integer joursSansMouvement
    ) {
    }

    public record AlertSeverityItem(
            String priorite,
            Integer total
    ) {
    }

    public record WarehouseActivityItem(
            Long entrepotId,
            String entrepotNom,
            Integer quantiteMouvementee,
            Integer totalMouvements
    ) {
    }
}
