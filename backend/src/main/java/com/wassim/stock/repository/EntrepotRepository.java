package com.wassim.stock.repository;

import com.wassim.stock.entity.Entrepot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EntrepotRepository extends JpaRepository<Entrepot, Long> {
    Optional<Entrepot> findByNomIgnoreCase(String nom);
}
