package com.wassim.stock.repository;

import com.wassim.stock.entity.MouvementStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {
    List<MouvementStock> findAllByOrderByDateDesc();

    List<MouvementStock> findByEntrepotIdOrderByDateDesc(Long entrepotId);

    boolean existsByProduitId(Long produitId);

    boolean existsByEntrepotId(Long entrepotId);
}
