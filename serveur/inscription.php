<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');

session_start();

require __DIR__ . '/reponse.php';

$corps = json_decode(file_get_contents('php://input'), true);
$corps = is_array($corps) ? $corps : [];

$email = strtolower(trim((string) ($corps['email'] ?? '')));
$mot_de_passe = (string) ($corps['mot_de_passe'] ?? '');
$nom = trim((string) ($corps['nom'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    repondre(['erreur' => 'Adresse email invalide'], 422);
}
if (strlen($mot_de_passe) < 8) {
    repondre(['erreur' => 'Le mot de passe doit contenir au moins 8 caractères'], 422);
}

try {
    require __DIR__ . '/configuration.php';

    $requete = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ?');
    $requete->execute([$email]);
    if ($requete->fetch()) {
        repondre(['erreur' => 'Un compte existe déjà avec cet email'], 409);
    }

    $requete = $pdo->prepare('INSERT INTO utilisateurs (email, mot_de_passe, nom) VALUES (?, ?, ?)');
    $requete->execute([$email, password_hash($mot_de_passe, PASSWORD_DEFAULT), $nom ?: null]);
    $id_utilisateur = (int) $pdo->lastInsertId();

    $_SESSION['id_utilisateur'] = $id_utilisateur;
    $_SESSION['email_utilisateur'] = $email;

    repondre(['succes' => true]);
} catch (Exception $e) {
    error_log('[cadence] inscription : ' . $e->getMessage());
    repondre(['erreur' => "Erreur serveur : impossible de joindre la base de données. Vérifie que MySQL est démarré."], 500);
}
