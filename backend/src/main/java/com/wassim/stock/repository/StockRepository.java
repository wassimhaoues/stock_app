package com.wassim.stock.repository;

import com.wassim.stock.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    @Override
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findAll();

    @Override
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Page<Stock> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<Stock> findByEntrepotId(Long entrepotId);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Page<Stock> findByEntrepotId(Long entrepotId, Pageable pageable);

    Optional<Stock> findByProduitIdAndEntrepotId(Long produitId, Long entrepotId);

    @Override
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Optional<Stock> findById(Long id);

    boolean existsByProduitId(Long produitId);

    boolean existsByEntrepotId(Long entrepotId);

    @Query("select coalesce(sum(stock.quantite), 0) from Stock stock where stock.entrepot.id = :entrepotId")
    Long sumQuantiteByEntrepotId(@Param("entrepotId") Long entrepotId);

    @Query("""
            select coalesce(sum(stock.quantite), 0)
            from Stock stock
            where stock.entrepot.id = :entrepotId
              and stock.id <> :stockId
            """)
    Long sumQuantiteByEntrepotIdExcludingStock(
            @Param("entrepotId") Long entrepotId,
            @Param("stockId") Long stockId
    );
}
