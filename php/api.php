<?php
declare(strict_types=1);

// Ne jamais exposer les erreurs PHP brutes au client : elles sont journalisées
// côté serveur, jamais affichées (et une erreur affichée casserait le JSON).
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

function respond($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function bodyJson(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// Évite de dupliquer prepare/execute/fetch à chaque fois qu'on doit relire
// une ligne par id (goals et challenges en ont chacun besoin).
function fetchById(PDO $pdo, string $table, int $id): array|false
{
    $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

try {
    require __DIR__ . '/config.php';

    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($action) {

        case 'summary': {
            $month = $_GET['month'] ?? date('Y-m');

            $stmt = $pdo->prepare("SELECT type, COALESCE(SUM(amount),0) AS total FROM transactions WHERE date LIKE ? GROUP BY type");
            $stmt->execute([$month . '%']);
            $totals = ['revenu' => 0.0, 'depense' => 0.0];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $totals[$row['type']] = (float) $row['total'];
            }
            $solde = $totals['revenu'] - $totals['depense'];
            $tauxEpargne = $totals['revenu'] > 0 ? round(($solde / $totals['revenu']) * 100, 1) : 0.0;

            $stmt = $pdo->prepare("SELECT category, COALESCE(SUM(amount),0) AS total FROM transactions WHERE type='depense' AND date LIKE ? GROUP BY category ORDER BY total DESC");
            $stmt->execute([$month . '%']);
            $byCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $goalsStmt = $pdo->query('SELECT COALESCE(SUM(current_amount),0) AS saved, COALESCE(SUM(target_amount),0) AS target FROM goals');
            $goalsTotals = $goalsStmt->fetch(PDO::FETCH_ASSOC);

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
            $stmt = $pdo->prepare('SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC, id DESC');
            $stmt->execute([$month . '%']);
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

            $stmt = $pdo->prepare('INSERT INTO transactions (type, category, label, amount, date) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$type, $category, $label, $amount, $date]);
            respond(['id' => (int)$pdo->lastInsertId(), 'success' => true]);
        }

        case 'delete_transaction': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            if ($id === false) respond(['error' => 'Identifiant invalide'], 422);

            $stmt = $pdo->prepare('DELETE FROM transactions WHERE id = ?');
            $stmt->execute([$id]);
            respond(['success' => true]);
        }

        case 'goals': {
            respond($pdo->query('SELECT * FROM goals ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'add_goal': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $name = trim((string)($body['name'] ?? ''));
            $category = trim((string)($body['category'] ?? 'autre'));
            $target = filter_var($body['target_amount'] ?? null, FILTER_VALIDATE_FLOAT);
            $deadline = $body['deadline'] ?? null;
            $icon = $body['icon'] ?? '🎯';

            if ($name === '' || $target === false || $target <= 0) {
                respond(['error' => 'Champs invalides'], 422);
            }

            $stmt = $pdo->prepare('INSERT INTO goals (name, category, target_amount, current_amount, deadline, icon) VALUES (?, ?, ?, 0, ?, ?)');
            $stmt->execute([$name, $category, $target, $deadline ?: null, $icon]);
            respond(['id' => (int)$pdo->lastInsertId(), 'success' => true]);
        }

        case 'contribute_goal': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            $amount = filter_var($body['amount'] ?? null, FILTER_VALIDATE_FLOAT);
            if (!$id || $amount === false || $amount <= 0) respond(['error' => 'Champs invalides'], 422);

            $stmt = $pdo->prepare('UPDATE goals SET current_amount = current_amount + ? WHERE id = ?');
            $stmt->execute([$amount, $id]);

            respond(['success' => true, 'goal' => fetchById($pdo, 'goals', $id)]);
        }

        case 'challenges': {
            respond($pdo->query('SELECT * FROM challenges ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC));
        }

        case 'checkin_challenge': {
            if ($method !== 'POST') respond(['error' => 'Méthode non autorisée'], 405);
            $body = bodyJson();
            $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
            if (!$id) respond(['error' => 'Identifiant invalide'], 422);

            $challenge = fetchById($pdo, 'challenges', $id);
            if (!$challenge) respond(['error' => 'Défi introuvable'], 404);

            $today = date('Y-m-d');
            if ($challenge['last_checkin'] === $today) {
                respond(['error' => 'Déjà validé aujourd\'hui', 'challenge' => $challenge], 409);
            }

            $progress = min((int)$challenge['progress_days'] + 1, (int)$challenge['target_days']);
            $status = $progress >= (int)$challenge['target_days'] ? 'termine' : 'actif';

            $stmt = $pdo->prepare('UPDATE challenges SET progress_days = ?, status = ?, last_checkin = ? WHERE id = ?');
            $stmt->execute([$progress, $status, $today, $id]);

            respond(['success' => true, 'challenge' => fetchById($pdo, 'challenges', $id)]);
        }

        default:
            respond(['error' => 'Action inconnue'], 400);
    }
} catch (Throwable $e) {
    error_log('[podium-budget] ' . $e->getMessage());
    respond(['error' => 'Erreur serveur, réessaie dans un instant.'], 500);
}
