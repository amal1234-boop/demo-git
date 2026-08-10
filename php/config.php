<?php
declare(strict_types=1);

// Identifiants MySQL — valeurs par défaut d'un XAMPP/WAMP/MAMP fraîchement
// installé (utilisateur root, sans mot de passe). Modifie ces 5 constantes
// si ta configuration locale est différente, ou définis les variables
// d'environnement correspondantes (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS).
//
// Le schéma (base + tables) n'est PAS créé ici : importe database.sql dans
// phpMyAdmin une bonne fois pour toutes, ce fichier se contente ensuite de
// s'y connecter.
const DB_HOST = 'localhost';
const DB_PORT = '3306';
const DB_NAME = 'cadence';
const DB_USER = 'root';
const DB_PASS = '';

$dbHost = getenv('DB_HOST') ?: DB_HOST;
$dbPort = getenv('DB_PORT') ?: DB_PORT;
$dbName = getenv('DB_NAME') ?: DB_NAME;
$dbUser = getenv('DB_USER') ?: DB_USER;
$dbPass = getenv('DB_PASS') ?: DB_PASS;

$pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
