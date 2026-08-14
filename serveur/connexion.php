<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

session_start();

require __DIR__ . '/reponse.php';

$body = json_decode(file_get_contents('php://input'), true);
$body = is_array($body) ? $body : [];

$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

try {
    require __DIR__ . '/configuration.php';

    $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        respond(['error' => 'Email ou mot de passe incorrect'], 401);
    }

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_email'] = $email;

    respond(['success' => true]);
} catch (Throwable $e) {
    error_log('[cadence] login: ' . $e->getMessage());
    respond(['error' => "Erreur serveur : impossible de joindre la base de données. Vérifie que MySQL est démarré."], 500);
}
