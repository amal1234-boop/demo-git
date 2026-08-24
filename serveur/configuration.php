<?php
declare(strict_types=1);

// Valeurs par défaut XAMPP/WAMP ; voir README pour les personnaliser.
const HOTE_BDD = 'localhost';
const PORT_BDD = '3306';
const NOM_BDD = 'cadence';
const UTILISATEUR_BDD = 'root';
const MDP_BDD = '';

$hote_bdd = getenv('DB_HOST') ?: HOTE_BDD;
$port_bdd = getenv('DB_PORT') ?: PORT_BDD;
$nom_bdd = getenv('DB_NAME') ?: NOM_BDD;
$utilisateur_bdd = getenv('DB_USER') ?: UTILISATEUR_BDD;
$mdp_bdd = getenv('DB_PASS') ?: MDP_BDD;

$pdo = new PDO("mysql:host={$hote_bdd};port={$port_bdd};dbname={$nom_bdd};charset=utf8mb4", $utilisateur_bdd, $mdp_bdd);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
