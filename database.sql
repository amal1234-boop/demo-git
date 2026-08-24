-- Schéma SQL de Cadence.
-- À importer dans phpMyAdmin : onglet "Importer" (choisis ce fichier) ou
-- colle tout ce contenu dans l'onglet "SQL" d'une base existante.

CREATE DATABASE IF NOT EXISTS `cadence` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cadence`;

-- Un compte par athlète : email + mot de passe haché (jamais en clair).
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(255),
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Revenus et dépenses, rattachés à un compte via id_utilisateur.
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    type ENUM('revenu','depense') NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    montant DOUBLE NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Objectifs d'épargne (fonds de reconversion, fonds blessure, projet...).
CREATE TABLE IF NOT EXISTS objectifs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(50) NOT NULL,
    montant_cible DOUBLE NOT NULL,
    montant_actuel DOUBLE NOT NULL DEFAULT 0,
    echeance DATE NULL,
    icone VARCHAR(50),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Défis d'épargne façon entraînement (séries de jours à valider).
CREATE TABLE IF NOT EXISTS defis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    jours_cible INT NOT NULL,
    jours_valides INT NOT NULL DEFAULT 0,
    statut ENUM('actif','termine') NOT NULL DEFAULT 'actif',
    dernier_pointage DATE NULL,
    badge VARCHAR(50),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;
