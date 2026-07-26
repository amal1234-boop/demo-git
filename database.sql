-- Schéma SQL de Cadence.
-- À importer dans phpMyAdmin : onglet "Importer" (choisis ce fichier) ou
-- colle tout ce contenu dans l'onglet "SQL" d'une base existante.

CREATE DATABASE IF NOT EXISTS `cadence` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cadence`;

-- Un compte par athlète : email + mot de passe haché (jamais en clair).
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Revenus et dépenses, rattachés à un compte via user_id.
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('revenu','depense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    amount DOUBLE NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Objectifs d'épargne (fonds de reconversion, fonds blessure, projet...).
CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_amount DOUBLE NOT NULL,
    current_amount DOUBLE NOT NULL DEFAULT 0,
    deadline DATE NULL,
    icon VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Défis d'épargne façon entraînement (séries de jours à valider).
CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_days INT NOT NULL,
    progress_days INT NOT NULL DEFAULT 0,
    status ENUM('actif','termine') NOT NULL DEFAULT 'actif',
    last_checkin DATE NULL,
    badge VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
