<?php
declare(strict_types=1);

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

$dbFile = $dataDir . '/budget.sqlite';

$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON');

$pdo->exec("
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec("
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('revenu','depense')),
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT
)");

$pdo->exec("
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT,
    icon TEXT
)");

$pdo->exec("
CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    target_days INTEGER NOT NULL,
    progress_days INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'actif',
    last_checkin TEXT,
    badge TEXT
)");

/**
 * Pré-remplit le compte d'un nouvel utilisateur avec un jeu de données de
 * démo (objectifs, défis, transactions) pour qu'il découvre l'app avec un
 * tableau de bord déjà vivant, plutôt qu'un écran vide. Les 3 lots sont
 * insérés dans une seule transaction SQL : soit tout est créé, soit rien.
 */
function seed_demo_data(PDO $pdo, int $userId): void
{
    $today = new DateTime();

    $pdo->beginTransaction();
    try {
        $goals = [
            ['Fonds de reconversion', 'reconversion', 15000, 3200, '2027-12-31', 'graduation'],
            ['Fonds blessure / coup dur', 'blessure', 5000, 1850, null, 'shield'],
            ['Projet post-carrière (coaching)', 'projet', 20000, 500, '2028-06-30', 'rocket'],
        ];
        $stmt = $pdo->prepare('INSERT INTO goals (user_id, name, category, target_amount, current_amount, deadline, icon) VALUES (?, ?, ?, ?, ?, ?, ?)');
        foreach ($goals as $g) {
            $stmt->execute(array_merge([$userId], $g));
        }

        $challenges = [
            ['Semaine sans dépense superflue', 'Ne rien dépenser en extra (hors matériel/coaching) pendant 7 jours d\'affilée.', 7, 3, 'actif', 'flame'],
            ['30 jours, 30 versements', 'Verser un petit montant sur le fonds de reconversion chaque jour pendant 30 jours.', 30, 12, 'actif', 'flame'],
            ['Sprint épargne primes', 'Mettre de côté 50% de chaque prime de compétition perçue ce trimestre.', 5, 2, 'actif', 'flame'],
        ];
        $stmt = $pdo->prepare('INSERT INTO challenges (user_id, title, description, target_days, progress_days, status, badge) VALUES (?, ?, ?, ?, ?, ?, ?)');
        foreach ($challenges as $c) {
            $stmt->execute(array_merge([$userId], $c));
        }

        $sample = [
            ['revenu', 'Aide fédération', 'Aide mensuelle fédération', 900, -2],
            ['revenu', 'Sponsoring', 'Versement trimestriel sponsor équipementier', 1500, -5],
            ['revenu', 'Primes de compétition', 'Prime podium meeting national', 600, -10],
            ['depense', 'Coaching / Préparation physique', 'Séances prépa physique', 220, -1],
            ['depense', 'Kiné / Médical', 'Suivi kiné hebdomadaire', 140, -3],
            ['depense', 'Équipement sportif', 'Renouvellement chaussures', 160, -6],
            ['depense', 'Déplacements compétitions', 'Trajet + hôtel meeting régional', 210, -8],
            ['depense', 'Nutrition / Compléments', 'Compléments alimentaires du mois', 95, -9],
            ['depense', 'Logement / Vie quotidienne', 'Loyer part athlète', 480, -12],
        ];
        $stmt = $pdo->prepare('INSERT INTO transactions (user_id, type, category, label, amount, date) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($sample as $t) {
            $date = (clone $today)->modify($t[4] . ' days')->format('Y-m-d');
            $stmt->execute([$userId, $t[0], $t[1], $t[2], $t[3], $date]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
