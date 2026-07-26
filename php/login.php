<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';

function respond($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$body = is_array($body) ? $body : [];

$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

try {
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
    respond(['error' => 'Erreur serveur', 'detail' => $e->getMessage()], 500);
}
