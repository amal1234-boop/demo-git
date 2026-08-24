<?php
declare(strict_types=1);

function exiger_connexion(): int
{
    if (empty($_SESSION['id_utilisateur'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['erreur' => 'Non authentifié']);
        exit;
    }
    return (int) $_SESSION['id_utilisateur'];
}
