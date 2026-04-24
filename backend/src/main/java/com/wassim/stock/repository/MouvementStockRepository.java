package com.wassim.stock.repository;

import com.wassim.stock.entity.MouvementStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<MouvementStock> findAllByOrderByDateDesc();

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Page<MouvementStock> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    List<MouvementStock> findByEntrepotIdOrderByDateDesc(Long entrepotId);

    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Page<MouvementStock> findByEntrepotId(Long entrepotId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"produit", "entrepot"})
    Optional<MouvementStock> findById(Long id);

    boolean existsByProduitIdAndEntrepotId(Long produitId, Long entrepotId);

    boolean existsByProduitId(Long produitId);

    boolean existsByEntrepotId(Long entrepotId);
}
