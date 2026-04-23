package com.wassim.stock.repository;

import com.wassim.stock.entity.MouvementStock;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<MouvementStock> findAllByOrderByDateDesc();

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<MouvementStock> findByEntrepotIdOrderByDateDesc(Long entrepotId);

    @Override
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Optional<MouvementStock> findById(Long id);

    boolean existsByProduitIdAndEntrepotId(Long produitId, Long entrepotId);

    boolean existsByProduitId(Long produitId);

    boolean existsByEntrepotId(Long entrepotId);
}
