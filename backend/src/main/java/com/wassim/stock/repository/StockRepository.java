package com.wassim.stock.repository;

import com.wassim.stock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    List<Stock> findByEntrepotId(Long entrepotId);

    Optional<Stock> findByProduitIdAndEntrepotId(Long produitId, Long entrepotId);

    boolean existsByProduitId(Long produitId);

    boolean existsByEntrepotId(Long entrepotId);
}
