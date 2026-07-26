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
$name = trim((string) ($body['name'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['error' => 'Adresse email invalide'], 422);
}
if (strlen($password) < 8) {
    respond(['error' => 'Le mot de passe doit contenir au moins 8 caractères'], 422);
}

try {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        respond(['error' => 'Un compte existe déjà avec cet email'], 409);
    }

    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    $stmt->execute([$email, password_hash($password, PASSWORD_DEFAULT), $name ?: null]);
    $userId = (int) $pdo->lastInsertId();

    seed_demo_data($pdo, $userId);

    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;

    respond(['success' => true]);
} catch (Throwable $e) {
    respond(['error' => 'Erreur serveur', 'detail' => $e->getMessage()], 500);
}
