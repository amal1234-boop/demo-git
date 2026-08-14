<?php
declare(strict_types=1);

/**
 * Envoie une réponse JSON avec le bon code HTTP et coupe l'exécution.
 * Partagée par tous les endpoints pour éviter de la redéfinir ailleurs.
 */
function respond($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
