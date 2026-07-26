<?php
declare(strict_types=1);

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

$dbFile = $dataDir . '/budget.sqlite';
$freshInstall = !file_exists($dbFile);

$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON');

$pdo->exec("
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    title TEXT NOT NULL,
    description TEXT,
    target_days INTEGER NOT NULL,
    progress_days INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'actif',
    last_checkin TEXT,
    badge TEXT
)");

if ($freshInstall) {
    $today = new DateTime();

    // Les 3 jeux de données de démo forment un seul lot cohérent : soit ils
    // sont tous insérés, soit aucun (évite un seed à moitié fait si une
    // requête échoue en cours de route).
    $pdo->beginTransaction();
    try {
        // Objectifs d'épargne pensés pour une carrière sportive courte et incertaine
        $goals = [
            ['Fonds de reconversion', 'reconversion', 15000, 3200, '2027-12-31', 'graduation'],
            ['Fonds blessure / coup dur', 'blessure', 5000, 1850, null, 'shield'],
            ['Projet post-carrière (coaching)', 'projet', 20000, 500, '2028-06-30', 'rocket'],
        ];
        $stmt = $pdo->prepare('INSERT INTO goals (name, category, target_amount, current_amount, deadline, icon) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($goals as $g) {
            $stmt->execute($g);
        }

        // Défis façon "entraînement" pour motiver l'épargne
        $challenges = [
            ['Semaine sans dépense superflue', 'Ne rien dépenser en extra (hors matériel/coaching) pendant 7 jours d\'affilée.', 7, 3, 'actif', 'flame'],
            ['30 jours, 30 versements', 'Verser un petit montant sur le fonds de reconversion chaque jour pendant 30 jours.', 30, 12, 'actif', 'flame'],
            ['Sprint épargne primes', 'Mettre de côté 50% de chaque prime de compétition perçue ce trimestre.', 5, 2, 'actif', 'flame'],
        ];
        $stmt = $pdo->prepare('INSERT INTO challenges (title, description, target_days, progress_days, status, badge) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($challenges as $c) {
            $stmt->execute($c);
        }

        // Transactions d'exemple sur le mois en cours, catégories spécifiques à un(e) athlète
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
        $stmt = $pdo->prepare('INSERT INTO transactions (type, category, label, amount, date) VALUES (?, ?, ?, ?, ?)');
        foreach ($sample as $t) {
            $date = (clone $today)->modify($t[4] . ' days')->format('Y-m-d');
            $stmt->execute([$t[0], $t[1], $t[2], $t[3], $date]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
