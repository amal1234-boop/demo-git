<?php
declare(strict_types=1);

// Identifiants MySQL — valeurs par défaut d'un XAMPP/WAMP/MAMP fraîchement
// installé (utilisateur root, sans mot de passe). Modifie ces 5 constantes
// si ta configuration locale est différente, ou définis les variables
// d'environnement correspondantes (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS).
//
// Le schéma (base + tables) n'est PAS créé ici : importe database.sql dans
// phpMyAdmin une bonne fois pour toutes, ce fichier se contente ensuite de
// s'y connecter.
const DB_HOST = 'localhost';
const DB_PORT = '3306';
const DB_NAME = 'cadence';
const DB_USER = 'root';
const DB_PASS = '';

$dbHost = getenv('DB_HOST') ?: DB_HOST;
$dbPort = getenv('DB_PORT') ?: DB_PORT;
$dbName = getenv('DB_NAME') ?: DB_NAME;
$dbUser = getenv('DB_USER') ?: DB_USER;
$dbPass = getenv('DB_PASS') ?: DB_PASS;

$pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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
