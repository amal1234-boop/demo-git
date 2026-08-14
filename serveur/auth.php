<?php
declare(strict_types=1);

/**
 * Vérifie qu'une session utilisateur est active ; sinon coupe la requête
 * avec une réponse JSON 401. Toujours appelée après session_start().
 */
function require_login(): int
{
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Non authentifié']);
        exit;
    }
    return (int) $_SESSION['user_id'];
}
