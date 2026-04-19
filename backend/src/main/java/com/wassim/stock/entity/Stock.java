package com.wassim.stock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "stocks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_stocks_produit_entrepot",
                columnNames = {"produit_id", "entrepot_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrepot_id", nullable = false)
    private Entrepot entrepot;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer quantite;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer seuilAlerte;
}
