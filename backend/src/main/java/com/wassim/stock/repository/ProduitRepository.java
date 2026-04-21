package com.wassim.stock.repository;

import com.wassim.stock.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Optional<Produit> findByNomIgnoreCase(String nom);
}
