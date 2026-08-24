<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

session_start();

require __DIR__ . '/reponse.php';

function corps_json(): array
{
    $brut = file_get_contents('php://input');
    if ($brut === false || $brut === '') {
        return [];
    }
    $decode = json_decode($brut, true);
    return is_array($decode) ? $decode : [];
}

function recuperer_par_id(PDO $pdo, string $table, int $id, int $id_utilisateur): ?array
{
    $requete = $pdo->prepare("SELECT * FROM {$table} WHERE id = ? AND id_utilisateur = ?");
    $requete->execute([$id, $id_utilisateur]);
    $ligne = $requete->fetch(PDO::FETCH_ASSOC);
    return $ligne === false ? null : $ligne;
}

try {
    require __DIR__ . '/configuration.php';
    require __DIR__ . '/authentification.php';

    $id_utilisateur = exiger_connexion();
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    $methode = $_SERVER['REQUEST_METHOD'];

    switch ($action) {
        case 'resume': {
            $mois = $_GET['mois'] ?? date('Y-m');

            $requete = $pdo->prepare("SELECT type, COALESCE(SUM(montant),0) AS total FROM transactions WHERE id_utilisateur = ? AND date LIKE ? GROUP BY type");
            $requete->execute([$id_utilisateur, $mois . '%']);
            $totaux = ['revenu' => 0.0, 'depense' => 0.0];
            foreach ($requete->fetchAll(PDO::FETCH_ASSOC) as $ligne) {
                $totaux[$ligne['type']] = (float) $ligne['total'];
            }
            $solde = $totaux['revenu'] - $totaux['depense'];
            $taux_epargne = $totaux['revenu'] > 0 ? round(($solde / $totaux['revenu']) * 100, 1) : 0.0;

            $requete = $pdo->prepare("SELECT categorie, COALESCE(SUM(montant),0) AS total FROM transactions WHERE type='depense' AND id_utilisateur = ? AND date LIKE ? GROUP BY categorie ORDER BY total DESC");
            $requete->execute([$id_utilisateur, $mois . '%']);
            $par_categorie = $requete->fetchAll(PDO::FETCH_ASSOC);

            $requete = $pdo->prepare('SELECT COALESCE(SUM(montant_actuel),0) AS epargne, COALESCE(SUM(montant_cible),0) AS cible FROM objectifs WHERE id_utilisateur = ?');
            $requete->execute([$id_utilisateur]);
            $totaux_objectifs = $requete->fetch(PDO::FETCH_ASSOC);

            repondre([
                'mois' => $mois,
                'revenus' => $totaux['revenu'],
                'depenses' => $totaux['depense'],
                'solde' => $solde,
                'taux_epargne' => $taux_epargne,
                'depenses_par_categorie' => $par_categorie,
                'objectifs_total_epargne' => (float) $totaux_objectifs['epargne'],
                'objectifs_total_cible' => (float) $totaux_objectifs['cible'],
            ]);
        }

        case 'transactions': {
            $mois = $_GET['mois'] ?? date('Y-m');
            $requete = $pdo->prepare('SELECT * FROM transactions WHERE id_utilisateur = ? AND date LIKE ? ORDER BY date DESC, id DESC');
            $requete->execute([$id_utilisateur, $mois . '%']);
            repondre($requete->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'ajouter_transaction': {
            if ($methode !== 'POST') repondre(['erreur' => 'Méthode non autorisée'], 405);
            $corps = corps_json();
            $type = $corps['type'] ?? '';
            $categorie = trim((string)($corps['categorie'] ?? ''));
            $libelle = trim((string)($corps['libelle'] ?? ''));
            $montant = filter_var($corps['montant'] ?? null, FILTER_VALIDATE_FLOAT);
            $date = $corps['date'] ?? date('Y-m-d');

            if (!in_array($type, ['revenu', 'depense'], true) || $categorie === '' || $libelle === '' || $montant === false || $montant <= 0) {
                repondre(['erreur' => 'Champs invalides'], 422);
            }

            $requete = $pdo->prepare('INSERT INTO transactions (id_utilisateur, type, categorie, libelle, montant, date) VALUES (?, ?, ?, ?, ?, ?)');
            $requete->execute([$id_utilisateur, $type, $categorie, $libelle, $montant, $date]);
            repondre(['id' => (int)$pdo->lastInsertId(), 'succes' => true]);
        }

        case 'supprimer_transaction': {
            if ($methode !== 'POST') repondre(['erreur' => 'Méthode non autorisée'], 405);
            $corps = corps_json();
            $id = filter_var($corps['id'] ?? null, FILTER_VALIDATE_INT);
            if ($id === false) repondre(['erreur' => 'Identifiant invalide'], 422);

            $requete = $pdo->prepare('DELETE FROM transactions WHERE id = ? AND id_utilisateur = ?');
            $requete->execute([$id, $id_utilisateur]);
            repondre(['succes' => true]);
        }

        case 'objectifs': {
            $requete = $pdo->prepare('SELECT * FROM objectifs WHERE id_utilisateur = ? ORDER BY id ASC');
            $requete->execute([$id_utilisateur]);
            repondre($requete->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'ajouter_objectif': {
            if ($methode !== 'POST') repondre(['erreur' => 'Méthode non autorisée'], 405);
            $corps = corps_json();
            $nom = trim((string)($corps['nom'] ?? ''));
            $categorie = trim((string)($corps['categorie'] ?? 'autre'));
            $cible = filter_var($corps['montant_cible'] ?? null, FILTER_VALIDATE_FLOAT);
            $echeance = $corps['echeance'] ?? null;
            $icone = $corps['icone'] ?? 'cible';

            if ($nom === '' || $cible === false || $cible <= 0) {
                repondre(['erreur' => 'Champs invalides'], 422);
            }

            $requete = $pdo->prepare('INSERT INTO objectifs (id_utilisateur, nom, categorie, montant_cible, montant_actuel, echeance, icone) VALUES (?, ?, ?, ?, 0, ?, ?)');
            $requete->execute([$id_utilisateur, $nom, $categorie, $cible, $echeance ?: null, $icone]);
            repondre(['id' => (int)$pdo->lastInsertId(), 'succes' => true]);
        }

        case 'contribuer_objectif': {
            if ($methode !== 'POST') repondre(['erreur' => 'Méthode non autorisée'], 405);
            $corps = corps_json();
            $id = filter_var($corps['id'] ?? null, FILTER_VALIDATE_INT);
            $montant = filter_var($corps['montant'] ?? null, FILTER_VALIDATE_FLOAT);
            if (!$id || $montant === false || $montant <= 0) repondre(['erreur' => 'Champs invalides'], 422);

            $requete = $pdo->prepare('UPDATE objectifs SET montant_actuel = montant_actuel + ? WHERE id = ? AND id_utilisateur = ?');
            $requete->execute([$montant, $id, $id_utilisateur]);
            if ($requete->rowCount() === 0) repondre(['erreur' => 'Objectif introuvable'], 404);

            repondre(['succes' => true, 'objectif' => recuperer_par_id($pdo, 'objectifs', $id, $id_utilisateur)]);
        }

        case 'defis': {
            $requete = $pdo->prepare('SELECT * FROM defis WHERE id_utilisateur = ? ORDER BY id ASC');
            $requete->execute([$id_utilisateur]);
            repondre($requete->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'ajouter_defi': {
            if ($methode !== 'POST') repondre(['erreur' => 'Méthode non autorisée'], 405);
            $corps = corps_json();
            $titre = trim((string)($corps['titre'] ?? ''));
            $description = trim((string)($corps['description'] ?? ''));
            $jours_cible = filter_var($corps['jours_cible'] ?? null, FILTER_VALIDATE_INT);

            if ($titre === '' || $jours_cible === false || $jours_cible <= 0) {
                repondre(['erreur' => 'Champs invalides'], 422);
            }

            $requete = $pdo->prepare("INSERT INTO defis (id_utilisateur, titre, description, jours_cible, jours_valides, statut, badge) VALUES (?, ?, ?, ?, 0, 'actif', 'flamme')");
            $requete->execute([$id_utilisateur, $titre, $description ?: null, $jours_cible]);
            repondre(['id' => (int)$pdo->lastInsertId(), 'succes' => true]);
        }

        case 'valider_defi': {
            if ($methode !== 'POST') repondre(['erreur' => 'Méthode non autorisée'], 405);
            $corps = corps_json();
            $id = filter_var($corps['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) repondre(['erreur' => 'Identifiant invalide'], 422);

            $defi = recuperer_par_id($pdo, 'defis', $id, $id_utilisateur);
            if (!$defi) repondre(['erreur' => 'Défi introuvable'], 404);

            $aujourd_hui = date('Y-m-d');
            if ($defi['dernier_pointage'] === $aujourd_hui) {
                repondre(['erreur' => 'Déjà validé aujourd\'hui', 'defi' => $defi], 409);
            }

            $progression = min((int)$defi['jours_valides'] + 1, (int)$defi['jours_cible']);
            $statut = $progression >= (int)$defi['jours_cible'] ? 'termine' : 'actif';

            $requete = $pdo->prepare('UPDATE defis SET jours_valides = ?, statut = ?, dernier_pointage = ? WHERE id = ? AND id_utilisateur = ?');
            $requete->execute([$progression, $statut, $aujourd_hui, $id, $id_utilisateur]);

            repondre(['succes' => true, 'defi' => recuperer_par_id($pdo, 'defis', $id, $id_utilisateur)]);
        }

        default:
            repondre(['erreur' => 'Action inconnue'], 400);
    }
} catch (Throwable $e) {
    error_log('[cadence] ' . $e->getMessage());
    repondre(['erreur' => 'Erreur serveur, réessaie dans un instant.'], 500);
}
