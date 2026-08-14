<?php
declare(strict_types=1);

// Valeurs par défaut XAMPP/WAMP ; voir README pour les personnaliser.
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
