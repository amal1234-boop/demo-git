-- Migration : renomme les tables/colonnes anglaises en français,
-- SANS perdre les données déjà présentes.
-- À exécuter une seule fois dans phpMyAdmin (onglet SQL), sur la base
-- `cadence` existante, AVANT de mettre à jour le code de l'application.

USE `cadence`;

-- Table users -> utilisateurs
RENAME TABLE users TO utilisateurs;
ALTER TABLE utilisateurs
    CHANGE COLUMN password_hash mot_de_passe VARCHAR(255) NOT NULL,
    CHANGE COLUMN name nom VARCHAR(255),
    CHANGE COLUMN created_at date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Table transactions (nom inchangé, colonnes renommées)
ALTER TABLE transactions
    CHANGE COLUMN user_id id_utilisateur INT NOT NULL,
    CHANGE COLUMN category categorie VARCHAR(100) NOT NULL,
    CHANGE COLUMN label libelle VARCHAR(255) NOT NULL,
    CHANGE COLUMN amount montant DOUBLE NOT NULL;

-- Table goals -> objectifs
RENAME TABLE goals TO objectifs;
ALTER TABLE objectifs
    CHANGE COLUMN user_id id_utilisateur INT NOT NULL,
    CHANGE COLUMN name nom VARCHAR(255) NOT NULL,
    CHANGE COLUMN category categorie VARCHAR(50) NOT NULL,
    CHANGE COLUMN target_amount montant_cible DOUBLE NOT NULL,
    CHANGE COLUMN current_amount montant_actuel DOUBLE NOT NULL DEFAULT 0,
    CHANGE COLUMN deadline echeance DATE NULL,
    CHANGE COLUMN icon icone VARCHAR(50);

-- Table challenges -> defis
RENAME TABLE challenges TO defis;
ALTER TABLE defis
    CHANGE COLUMN user_id id_utilisateur INT NOT NULL,
    CHANGE COLUMN title titre VARCHAR(255) NOT NULL,
    CHANGE COLUMN target_days jours_cible INT NOT NULL,
    CHANGE COLUMN progress_days jours_valides INT NOT NULL DEFAULT 0,
    CHANGE COLUMN status statut ENUM('actif','termine') NOT NULL DEFAULT 'actif',
    CHANGE COLUMN last_checkin dernier_pointage DATE NULL;

-- Les icônes déjà enregistrées utilisaient des clés anglaises
-- (graduation, shield, rocket, target, flame, trophy) ; le nouveau code
-- utilise des clés françaises. On les convertit pour que les icônes des
-- objectifs déjà créés continuent de s'afficher correctement.
UPDATE objectifs SET icone = 'diplome'  WHERE icone = 'graduation';
UPDATE objectifs SET icone = 'bouclier' WHERE icone = 'shield';
UPDATE objectifs SET icone = 'fusee'    WHERE icone = 'rocket';
UPDATE objectifs SET icone = 'cible'    WHERE icone = 'target';
