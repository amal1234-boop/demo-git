<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

session_start();

require __DIR__ . '/reponse.php';

function bodyJson(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function fetchOwnedById(PDO $pdo, string $table, int $id, int $userId): array|false
{
    $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

try {
    require __DIR__ . '/configuration.php';
    require __DIR__ . '/authentification.php';

    $userId = require_login();
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($action) {
        case 'summary': {
            $month = $_GET['month'] ?? date('Y-m');

            $stmt = $pdo->prepare("SELECT type, COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = ? AND date LIKE ? GROUP BY type");
            $stmt->execute([$userId, $month . '%']);
            $totals = ['revenu' => 0.0, 'depense' => 0.0];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $totals[$row['type']] = (float) $row['total'];
            }
            $solde = $totals['revenu'] - $totals['depense'];
            $tauxEpargne = $totals['revenu'] > 0 ? round(($solde / $totals['revenu']) * 100, 1) : 0.0;

            $stmt = $pdo->prepare("SELECT category, COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='depense' AND user_id = ? AND date LIKE ? GROUP BY category ORDER BY total DESC");
            $stmt->execute([$userId, $month . '%']);
            $byCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare('SELECT COALESCE(SUM(current_amount),0) AS saved, COALESCE(SUM(target_amount),0) AS target FROM goals WHERE user_id = ?');
            $stmt->execute([$userId]);
            $goalsTotals = $stmt->fetch(PDO::FETCH_ASSOC);

            respond([
                'month' => $month,
                'revenus' => $totals['revenu'],
                'depenses' => $totals['depense'],
                'solde' => $solde,
                'taux_epargne' => $tauxEpargne,
                'depenses_par_categorie' => $byCategory,
                'objectifs_total_epargne' => (float) $goalsTotals['saved'],
                'objectifs_total_cible' => (float) $goalsTotals['target'],
            ]);
        }

        case 'transactions': {
            $month = $_GET['month'] ?? date('Y-m');
            $stmt = $pdo->prepare('SELECT * FROM transactions WHERE user_id = ? AND date LIKE ? ORDER BY date DESC, id DESC');
            $stmt->execute([$userId, $month . '%']);
            respond($stmt->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'add_transaction': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $type = $body['type'] ?? '';
            $category = trim((string)($body['category'] ?? ''));
            $label = trim((string)($body['label'] ?? ''));
            $amount = filter_var($body['amount'] ?? null, FILTER_VALIDATE_FLOAT);
            $date = $body['date'] ?? date('Y-m-d');

            if (!in_array($type, ['revenu', 'depense'], true) || $category === '' || $label === '' || $amount === false || $amount <= 0) {
                respond(['error' => 'Champs invalides'], 422);
            }

            $stmt = $pdo->prepare('INSERT INTO transactions (user_id, type, category, label, amount, date) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$userId, $type, $category, $label, $amount, $date]);
            respond(['id' => (int)$pdo->lastInsertId(), 'success' => true]);
        }

        case 'delete_transaction': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            if ($id === false) respond(['error' => 'Identifiant invalide'], 422);

            $stmt = $pdo->prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            respond(['success' => true]);
        }

        case 'goals': {
            $stmt = $pdo->prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY id ASC');
            $stmt->execute([$userId]);
            respond($stmt->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'add_goal': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $name = trim((string)($body['name'] ?? ''));
            $category = trim((string)($body['category'] ?? 'autre'));
            $target = filter_var($body['target_amount'] ?? null, FILTER_VALIDATE_FLOAT);
            $deadline = $body['deadline'] ?? null;
            $icon = $body['icon'] ?? 'target';

            if ($name === '' || $target === false || $target <= 0) {
                respond(['error' => 'Champs invalides'], 422);
            }

            $stmt = $pdo->prepare('INSERT INTO goals (user_id, name, category, target_amount, current_amount, deadline, icon) VALUES (?, ?, ?, ?, 0, ?, ?)');
            $stmt->execute([$userId, $name, $category, $target, $deadline ?: null, $icon]);
            respond(['id' => (int)$pdo->lastInsertId(), 'success' => true]);
        }

        case 'contribute_goal': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            $amount = filter_var($body['amount'] ?? null, FILTER_VALIDATE_FLOAT);
            if (!$id || $amount === false || $amount <= 0) respond(['error' => 'Champs invalides'], 422);

            $stmt = $pdo->prepare('UPDATE goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$amount, $id, $userId]);
            if ($stmt->rowCount() === 0) respond(['error' => 'Objectif introuvable'], 404);

            respond(['success' => true, 'goal' => fetchOwnedById($pdo, 'goals', $id, $userId)]);
        }

        case 'challenges': {
            $stmt = $pdo->prepare('SELECT * FROM challenges WHERE user_id = ? ORDER BY id ASC');
            $stmt->execute([$userId]);
            respond($stmt->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'add_challenge': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $title = trim((string)($body['title'] ?? ''));
            $description = trim((string)($body['description'] ?? ''));
            $targetDays = filter_var($body['target_days'] ?? null, FILTER_VALIDATE_INT);

            if ($title === '' || $targetDays === false || $targetDays <= 0) {
                respond(['error' => 'Champs invalides'], 422);
            }

            $stmt = $pdo->prepare("INSERT INTO challenges (user_id, title, description, target_days, progress_days, status, badge) VALUES (?, ?, ?, ?, 0, 'actif', 'flame')");
            $stmt->execute([$userId, $title, $description ?: null, $targetDays]);
            respond(['id' => (int)$pdo->lastInsertId(), 'success' => true]);
        }

        case 'checkin_challenge': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) respond(['error' => 'Identifiant invalide'], 422);

            $challenge = fetchOwnedById($pdo, 'challenges', $id, $userId);
            if (!$challenge) respond(['error' => 'Défi introuvable'], 404);

            $today = date('Y-m-d');
            if ($challenge['last_checkin'] === $today) {
                respond(['error' => 'Déjà validé aujourd\'hui', 'challenge' => $challenge], 409);
            }

            $progress = min((int)$challenge['progress_days'] + 1, (int)$challenge['target_days']);
            $status = $progress >= (int)$challenge['target_days'] ? 'termine' : 'actif';

            $stmt = $pdo->prepare('UPDATE challenges SET progress_days = ?, status = ?, last_checkin = ? WHERE id = ? AND user_id = ?');
            $stmt->execute([$progress, $status, $today, $id, $userId]);

            respond(['success' => true, 'challenge' => fetchOwnedById($pdo, 'challenges', $id, $userId)]);
        }

        default:
            respond(['error' => 'Action inconnue'], 400);
    }
} catch (Throwable $e) {
    error_log('[cadence] ' . $e->getMessage());
    respond(['error' => 'Erreur serveur, réessaie dans un instant.'], 500);
}
