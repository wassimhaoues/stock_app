package com.wassim.stock.service;

import com.wassim.stock.dto.response.AdminAnalyticsResponse;
import com.wassim.stock.dto.response.AlerteResponse;
import com.wassim.stock.dto.response.DashboardAnalyticsResponse;
import com.wassim.stock.dto.response.DashboardKpisResponse;
import com.wassim.stock.dto.response.DashboardStatsResponse;
import com.wassim.stock.entity.Entrepot;
import com.wassim.stock.entity.MouvementStock;
import com.wassim.stock.entity.Role;
import com.wassim.stock.entity.Stock;
import com.wassim.stock.entity.TypeMouvement;
import com.wassim.stock.entity.Utilisateur;
import com.wassim.stock.exception.BadRequestException;
import com.wassim.stock.exception.ResourceNotFoundException;
import com.wassim.stock.repository.EntrepotRepository;
import com.wassim.stock.repository.MouvementStockRepository;
import com.wassim.stock.repository.ProduitRepository;
import com.wassim.stock.repository.StockRepository;
import com.wassim.stock.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int DORMANT_DAYS = 30;

    private final AlerteService alerteService;
    private final EntrepotRepository entrepotRepository;
    private final MouvementStockRepository mouvementStockRepository;
    private final ProduitRepository produitRepository;
    private final StockRepository stockRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        DashboardScope scope = buildScope();
        List<AlerteResponse> alertes = alerteService.findAll();
        int totalCapacity = scope.entrepots()
                .stream()
                .mapToInt(Entrepot::getCapacite)
                .sum();
        int usedCapacity = scope.stocks()
                .stream()
                .mapToInt(Stock::getQuantite)
                .sum();
        int availableCapacity = Math.max(totalCapacity - usedCapacity, 0);
        double saturationRate = totalCapacity == 0 ? 0 : (double) usedCapacity / totalCapacity;

        return new DashboardStatsResponse(
                (long) scope.entrepots().size(),
                produitRepository.count(),
                (long) scope.stocks().size(),
                (long) scope.mouvements().size(),
                calculateStockValue(scope.stocks()),
                alertes.size(),
                usedCapacity,
                availableCapacity,
                saturationRate
        );
    }

    @Transactional(readOnly = true)
    public DashboardKpisResponse getKpis() {
        DashboardScope scope = buildScope();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.toLocalDate().minusDays(now.getDayOfWeek().getValue() - 1L).atStartOfDay();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        List<AlerteResponse> alertes = alerteService.findAll();
        int stockLines = scope.stocks().size();
        Set<Long> activeProducts = scope.stocks()
                .stream()
                .filter(stock -> stock.getQuantite() > 0)
                .map(stock -> stock.getProduit().getId())
                .collect(Collectors.toSet());

        return new DashboardKpisResponse(
                calculateStockValue(scope.stocks()),
                activeProducts.size(),
                alertes.size(),
                stockLines == 0 ? 0 : (double) alertes.size() / stockLines,
                sumMovements(scope.mouvements(), TypeMouvement.ENTREE, startOfDay),
                sumMovements(scope.mouvements(), TypeMouvement.SORTIE, startOfDay),
                sumMovements(scope.mouvements(), TypeMouvement.ENTREE, startOfWeek),
                sumMovements(scope.mouvements(), TypeMouvement.SORTIE, startOfWeek),
                sumMovements(scope.mouvements(), TypeMouvement.ENTREE, startOfMonth),
                sumMovements(scope.mouvements(), TypeMouvement.SORTIE, startOfMonth),
                findDormantStocks(scope.stocks(), scope.mouvements()).size(),
                estimateCoverageDays(scope.stocks(), scope.mouvements()),
                buildWarehouseValues(scope.entrepots(), scope.stocks()),
                buildWarehouseCapacities(scope.entrepots(), scope.stocks())
        );
    }

    @Transactional(readOnly = true)
    public DashboardAnalyticsResponse getAnalytics() {
        DashboardScope scope = buildScope();
        List<AlerteResponse> alertes = alerteService.findAll();

        return new DashboardAnalyticsResponse(
                buildMovementTrend(scope.mouvements()),
                buildWarehouseDistribution(scope.entrepots(), scope.stocks(), alertes),
                buildTopProducts(scope.stocks(), scope.mouvements()),
                findDormantStocks(scope.stocks(), scope.mouvements()),
                buildAlertSeverity(alertes),
                buildWarehouseActivity(scope.entrepots(), scope.mouvements())
        );
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAdminAnalytics() {
        DashboardScope scope = buildScope();
        if (scope.currentUser().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Acces refuse");
        }

        List<AlerteResponse> alertes = alerteService.findAll();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        Map<Long, Long> alertesByWarehouse = alertes
                .stream()
                .collect(Collectors.groupingBy(AlerteResponse::entrepotId, Collectors.counting()));
        List<AdminAnalyticsResponse.WarehouseBenchmarkItem> benchmarkItems = scope.entrepots()
                .stream()
                .map(entrepot -> new AdminAnalyticsResponse.WarehouseBenchmarkItem(
                        entrepot.getId(),
                        entrepot.getNom(),
                        calculateWarehouseValue(entrepot.getId(), scope.stocks()),
                        countMovementsByWarehouse(scope.mouvements(), entrepot.getId(), startOfMonth),
                        alertesByWarehouse.getOrDefault(entrepot.getId(), 0L).intValue(),
                        calculateSaturationRate(entrepot, scope.stocks())
                ))
                .sorted(Comparator.comparing(AdminAnalyticsResponse.WarehouseBenchmarkItem::valeurStock).reversed())
                .toList();

        BigDecimal averageValue = benchmarkItems.isEmpty()
                ? BigDecimal.ZERO
                : calculateStockValue(scope.stocks()).divide(BigDecimal.valueOf(benchmarkItems.size()), 2, RoundingMode.HALF_UP);
        int warehousesAtCapacityRisk = (int) benchmarkItems
                .stream()
                .filter(item -> item.tauxSaturation() >= 0.9)
                .count();

        return new AdminAnalyticsResponse(averageValue, warehousesAtCapacityRisk, benchmarkItems);
    }

    private DashboardScope buildScope() {
        Utilisateur currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return new DashboardScope(
                    currentUser,
                    entrepotRepository.findAll(),
                    stockRepository.findAll(),
                    mouvementStockRepository.findAllByOrderByDateDesc()
            );
        }

        Entrepot assignedEntrepot = getAssignedEntrepot(currentUser);
        return new DashboardScope(
                currentUser,
                List.of(assignedEntrepot),
                stockRepository.findByEntrepotId(assignedEntrepot.getId()),
                mouvementStockRepository.findByEntrepotIdOrderByDateDesc(assignedEntrepot.getId())
        );
    }

    private BigDecimal calculateStockValue(List<Stock> stocks) {
        return stocks
                .stream()
                .map(stock -> stock.getProduit().getPrix().multiply(BigDecimal.valueOf(stock.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateWarehouseValue(Long entrepotId, List<Stock> stocks) {
        return calculateStockValue(stocks
                .stream()
                .filter(stock -> stock.getEntrepot().getId().equals(entrepotId))
                .toList());
    }

    private int sumMovements(List<MouvementStock> mouvements, TypeMouvement type, LocalDateTime since) {
        return mouvements
                .stream()
                .filter(mouvement -> mouvement.getType() == type)
                .filter(mouvement -> !mouvement.getDate().isBefore(since))
                .mapToInt(MouvementStock::getQuantite)
                .sum();
    }

    private int countMovementsByWarehouse(List<MouvementStock> mouvements, Long entrepotId, LocalDateTime since) {
        return (int) mouvements
                .stream()
                .filter(mouvement -> mouvement.getEntrepot().getId().equals(entrepotId))
                .filter(mouvement -> !mouvement.getDate().isBefore(since))
                .count();
    }

    private Double estimateCoverageDays(List<Stock> stocks, List<MouvementStock> mouvements) {
        LocalDateTime since = LocalDateTime.now().minusDays(DORMANT_DAYS);
        int outgoingQuantity = sumMovements(mouvements, TypeMouvement.SORTIE, since);
        if (outgoingQuantity == 0) {
            return null;
        }

        int totalQuantity = stocks.stream().mapToInt(Stock::getQuantite).sum();
        double averageDailyOutgoing = outgoingQuantity / (double) DORMANT_DAYS;
        return totalQuantity / averageDailyOutgoing;
    }

    private List<DashboardKpisResponse.WarehouseValueKpi> buildWarehouseValues(
            List<Entrepot> entrepots,
            List<Stock> stocks
    ) {
        return entrepots
                .stream()
                .map(entrepot -> new DashboardKpisResponse.WarehouseValueKpi(
                        entrepot.getId(),
                        entrepot.getNom(),
                        calculateWarehouseValue(entrepot.getId(), stocks)
                ))
                .sorted(Comparator.comparing(DashboardKpisResponse.WarehouseValueKpi::valeurStock).reversed())
                .toList();
    }

    private List<DashboardKpisResponse.WarehouseCapacityKpi> buildWarehouseCapacities(
            List<Entrepot> entrepots,
            List<Stock> stocks
    ) {
        return entrepots
                .stream()
                .map(entrepot -> {
                    int usedCapacity = usedCapacity(entrepot.getId(), stocks);
                    int availableCapacity = Math.max(entrepot.getCapacite() - usedCapacity, 0);
                    return new DashboardKpisResponse.WarehouseCapacityKpi(
                            entrepot.getId(),
                            entrepot.getNom(),
                            entrepot.getCapacite(),
                            usedCapacity,
                            availableCapacity,
                            calculateSaturationRate(entrepot, stocks)
                    );
                })
                .sorted(Comparator.comparing(DashboardKpisResponse.WarehouseCapacityKpi::tauxSaturation).reversed())
                .toList();
    }

    private List<DashboardAnalyticsResponse.MovementTrendPoint> buildMovementTrend(List<MouvementStock> mouvements) {
        LocalDate firstDay = LocalDate.now().minusDays(6);
        return firstDay
                .datesUntil(LocalDate.now().plusDays(1))
                .map(day -> new DashboardAnalyticsResponse.MovementTrendPoint(
                        day,
                        sumMovementsForDay(mouvements, TypeMouvement.ENTREE, day),
                        sumMovementsForDay(mouvements, TypeMouvement.SORTIE, day)
                ))
                .toList();
    }

    private int sumMovementsForDay(List<MouvementStock> mouvements, TypeMouvement type, LocalDate day) {
        return mouvements
                .stream()
                .filter(mouvement -> mouvement.getType() == type)
                .filter(mouvement -> mouvement.getDate().toLocalDate().equals(day))
                .mapToInt(MouvementStock::getQuantite)
                .sum();
    }

    private List<DashboardAnalyticsResponse.WarehouseDistributionItem> buildWarehouseDistribution(
            List<Entrepot> entrepots,
            List<Stock> stocks,
            List<AlerteResponse> alertes
    ) {
        Map<Long, Long> alertesByWarehouse = alertes
                .stream()
                .collect(Collectors.groupingBy(AlerteResponse::entrepotId, Collectors.counting()));

        return entrepots
                .stream()
                .map(entrepot -> new DashboardAnalyticsResponse.WarehouseDistributionItem(
                        entrepot.getId(),
                        entrepot.getNom(),
                        usedCapacity(entrepot.getId(), stocks),
                        calculateWarehouseValue(entrepot.getId(), stocks),
                        alertesByWarehouse.getOrDefault(entrepot.getId(), 0L).intValue(),
                        calculateSaturationRate(entrepot, stocks)
                ))
                .sorted(Comparator.comparing(DashboardAnalyticsResponse.WarehouseDistributionItem::valeurStock).reversed())
                .toList();
    }

    private List<DashboardAnalyticsResponse.TopProductMovementItem> buildTopProducts(
            List<Stock> stocks,
            List<MouvementStock> mouvements
    ) {
        Map<Long, Integer> quantitiesByProduct = mouvements
                .stream()
                .collect(Collectors.groupingBy(
                        mouvement -> mouvement.getProduit().getId(),
                        Collectors.summingInt(MouvementStock::getQuantite)
                ));
        Map<Long, Stock> stockByProduct = stocks
                .stream()
                .collect(Collectors.toMap(stock -> stock.getProduit().getId(), Function.identity(), (first, second) -> first));

        return quantitiesByProduct
                .entrySet()
                .stream()
                .map(entry -> {
                    Stock stock = stockByProduct.get(entry.getKey());
                    String productName = stock != null
                            ? stock.getProduit().getNom()
                            : findProductNameFromMovement(mouvements, entry.getKey());
                    BigDecimal stockValue = stock == null
                            ? BigDecimal.ZERO
                            : stock.getProduit().getPrix().multiply(BigDecimal.valueOf(stock.getQuantite()));
                    return new DashboardAnalyticsResponse.TopProductMovementItem(
                            entry.getKey(),
                            productName,
                            entry.getValue(),
                            stockValue
                    );
                })
                .sorted(Comparator.comparing(DashboardAnalyticsResponse.TopProductMovementItem::quantiteMouvementee).reversed())
                .limit(5)
                .toList();
    }

    private String findProductNameFromMovement(List<MouvementStock> mouvements, Long produitId) {
        return mouvements
                .stream()
                .filter(mouvement -> mouvement.getProduit().getId().equals(produitId))
                .map(mouvement -> mouvement.getProduit().getNom())
                .findFirst()
                .orElse("Produit");
    }

    private List<DashboardAnalyticsResponse.DormantStockItem> findDormantStocks(
            List<Stock> stocks,
            List<MouvementStock> mouvements
    ) {
        LocalDateTime limit = LocalDateTime.now().minusDays(DORMANT_DAYS);
        Map<String, LocalDateTime> latestMovementByStock = mouvements
                .stream()
                .collect(Collectors.groupingBy(
                        mouvement -> movementStockKey(mouvement.getProduit().getId(), mouvement.getEntrepot().getId()),
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparing(MouvementStock::getDate)),
                                optional -> optional.map(MouvementStock::getDate).orElse(null)
                        )
                ));

        return stocks
                .stream()
                .filter(stock -> stock.getQuantite() > 0)
                .map(stock -> {
                    LocalDateTime latestMovement = latestMovementByStock.get(
                            movementStockKey(stock.getProduit().getId(), stock.getEntrepot().getId())
                    );
                    if (latestMovement != null && !latestMovement.isBefore(limit)) {
                        return null;
                    }

                    int daysWithoutMovement = latestMovement == null
                            ? DORMANT_DAYS
                            : Math.toIntExact(ChronoUnit.DAYS.between(latestMovement.toLocalDate(), LocalDate.now()));
                    return new DashboardAnalyticsResponse.DormantStockItem(
                            stock.getId(),
                            stock.getProduit().getNom(),
                            stock.getEntrepot().getNom(),
                            stock.getQuantite(),
                            daysWithoutMovement
                    );
                })
                .filter(item -> item != null)
                .sorted(Comparator.comparing(DashboardAnalyticsResponse.DormantStockItem::quantite).reversed())
                .limit(5)
                .toList();
    }

    private String movementStockKey(Long produitId, Long entrepotId) {
        return produitId + ":" + entrepotId;
    }

    private List<DashboardAnalyticsResponse.AlertSeverityItem> buildAlertSeverity(List<AlerteResponse> alertes) {
        return alertes
                .stream()
                .collect(Collectors.groupingBy(AlerteResponse::priorite, Collectors.counting()))
                .entrySet()
                .stream()
                .map(entry -> new DashboardAnalyticsResponse.AlertSeverityItem(entry.getKey(), entry.getValue().intValue()))
                .sorted(Comparator.comparing(DashboardAnalyticsResponse.AlertSeverityItem::priorite))
                .toList();
    }

    private List<DashboardAnalyticsResponse.WarehouseActivityItem> buildWarehouseActivity(
            List<Entrepot> entrepots,
            List<MouvementStock> mouvements
    ) {
        return entrepots
                .stream()
                .map(entrepot -> {
                    List<MouvementStock> warehouseMovements = mouvements
                            .stream()
                            .filter(mouvement -> mouvement.getEntrepot().getId().equals(entrepot.getId()))
                            .toList();
                    int movedQuantity = warehouseMovements
                            .stream()
                            .mapToInt(MouvementStock::getQuantite)
                            .sum();
                    return new DashboardAnalyticsResponse.WarehouseActivityItem(
                            entrepot.getId(),
                            entrepot.getNom(),
                            movedQuantity,
                            warehouseMovements.size()
                    );
                })
                .sorted(Comparator.comparing(DashboardAnalyticsResponse.WarehouseActivityItem::quantiteMouvementee).reversed())
                .limit(5)
                .toList();
    }

    private int usedCapacity(Long entrepotId, List<Stock> stocks) {
        return stocks
                .stream()
                .filter(stock -> stock.getEntrepot().getId().equals(entrepotId))
                .mapToInt(Stock::getQuantite)
                .sum();
    }

    private double calculateSaturationRate(Entrepot entrepot, List<Stock> stocks) {
        if (entrepot.getCapacite() == 0) {
            return 0;
        }

        return (double) usedCapacity(entrepot.getId(), stocks) / entrepot.getCapacite();
    }

    private Utilisateur getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Entrepot getAssignedEntrepot(Utilisateur utilisateur) {
        if (utilisateur.getEntrepot() == null) {
            throw new BadRequestException("Aucun entrepot n'est affecte a ce compte");
        }

        return utilisateur.getEntrepot();
    }

    private record DashboardScope(
            Utilisateur currentUser,
            List<Entrepot> entrepots,
            List<Stock> stocks,
            List<MouvementStock> mouvements
    ) {
    }
}
