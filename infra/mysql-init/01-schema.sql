START TRANSACTION;
SET time_zone = "+01:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS `stock_app_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `stock_app_db`;

CREATE TABLE IF NOT EXISTS `entrepots` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(255) NOT NULL,
  `adresse` VARCHAR(255) NOT NULL,
  `capacite` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entrepots_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'GESTIONNAIRE', 'OBSERVATEUR') NOT NULL,
  `entrepot_id` BIGINT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_utilisateurs_email` (`email`),
  KEY `idx_utilisateurs_entrepot_id` (`entrepot_id`),
  CONSTRAINT `fk_utilisateurs_entrepot`
    FOREIGN KEY (`entrepot_id`) REFERENCES `entrepots` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `produits` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `nom` VARCHAR(255) NOT NULL,
  `categorie` VARCHAR(255) NOT NULL,
  `prix` DECIMAL(12, 2) NOT NULL,
  `fournisseur` VARCHAR(255) NOT NULL,
  `seuil_min` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


COMMIT;
SET FOREIGN_KEY_CHECKS=1;
