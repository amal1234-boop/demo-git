<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');

session_start();

require __DIR__ . '/reponse.php';

$corps = json_decode(file_get_contents('php://input'), true);
$corps = is_array($corps) ? $corps : [];

$email = strtolower(trim((string) ($corps['email'] ?? '')));
$mot_de_passe = (string) ($corps['mot_de_passe'] ?? '');

try {
    require __DIR__ . '/configuration.php';

    $requete = $pdo->prepare('SELECT id, mot_de_passe FROM utilisateurs WHERE email = ?');
    $requete->execute([$email]);
    $utilisateur = $requete->fetch(PDO::FETCH_ASSOC);

    if (!$utilisateur || !password_verify($mot_de_passe, $utilisateur['mot_de_passe'])) {
        repondre(['erreur' => 'Email ou mot de passe incorrect'], 401);
    }

    $_SESSION['id_utilisateur'] = (int) $utilisateur['id'];
    $_SESSION['email_utilisateur'] = $email;

    repondre(['succes' => true]);
} catch (Exception $e) {
    error_log('[cadence] connexion : ' . $e->getMessage());
    repondre(['erreur' => "Erreur serveur : impossible de joindre la base de données. Vérifie que MySQL est démarré."], 500);
}
