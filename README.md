# Cadence

Application de gestion de budget pensée pour un **athlète de haut niveau** :
revenus irréguliers (sponsoring, primes, aides fédérales), dépenses sportives
spécifiques (coaching, kiné, équipement, déplacements) et besoin de préparer
l'après-carrière.

## Stack

- **Frontend** : HTML / CSS / JavaScript (vanilla, sans dépendance externe)
- **Backend** : PHP (API JSON dans `php/api.php`)
- **Stockage** : base SQL (SQLite via PDO), schéma relationnel avec une table
  `users` et les données (`transactions`, `goals`, `challenges`) rattachées à
  chaque compte par une clé étrangère `user_id`. La base est créée et ses
  tables initialisées automatiquement au premier appel (`data/budget.sqlite`).

## Comptes & authentification

Chaque athlète a son propre compte et ses propres données :

- **Inscription** (`inscription.html`) : email + mot de passe (8 caractères
  minimum, hashé avec `password_hash()`), prénom optionnel. Un compte
  nouvellement créé reçoit un jeu de données de démo (objectifs, défis,
  transactions) pour ne pas démarrer sur un tableau de bord vide.
- **Connexion** (`connexion.html`) : email + mot de passe, vérifié avec
  `password_verify()`.
- **Session** : gérée côté serveur avec les sessions PHP natives. `app.php`
  vérifie la session à chaque chargement et redirige vers `connexion.html`
  si l'utilisateur n'est pas connecté ; `php/api.php` fait de même pour
  chaque appel et ne renvoie jamais les données d'un autre compte.
- **Déconnexion** : bouton "Déconnexion" dans l'app, détruit la session.

## Fonctionnalités

- Tableau de bord mensuel (revenus, dépenses, solde, taux d'épargne)
- Répartition des dépenses par catégorie
- Gestion des revenus/dépenses (ajout, suppression, catégories adaptées à un
  sportif de haut niveau)
- Objectifs d'épargne dédiés (fonds de reconversion, fonds blessure, projet
  post-carrière) avec barres de progression façon "piste d'athlétisme"
- Défis d'épargne façon entraînement (séries de jours) pour entretenir la
  motivation
- Score de forme financière, simulateur de résistance en cas de blessure,
  match mensuel "Toi vs Toi", arrondis d'entraînement (voir la page d'accueil
  pour le détail de chaque fonctionnalité)

## Lancer le site en local

Prérequis : PHP 8+ avec l'extension `pdo_sqlite` (activée par défaut dans la
plupart des distributions PHP).

```bash
php -S localhost:8000
```

Puis ouvrir [http://localhost:8000](http://localhost:8000) : la page
d'accueil propose de créer un compte, ce qui donne accès au tableau de bord
avec un jeu de données de démo prêt à l'emploi.

## Structure du projet

```
index.html            Page d'accueil (marketing, non protégée)
inscription.html       Formulaire de création de compte
connexion.html          Formulaire de connexion
app.php                 Application (protégée par session PHP)
css/style.css           Thème visuel partagé par toutes les pages
css/landing.css         Styles propres à la page d'accueil
css/auth.css            Styles propres aux pages inscription/connexion
js/app.js               Logique front de l'application (appels API, onglets)
php/config.php          Connexion PDO + schéma SQL + seed de démo par compte
php/auth.php            Garde de session réutilisée par l'API
php/register.php        Endpoint d'inscription
php/login.php           Endpoint de connexion
php/logout.php          Endpoint de déconnexion
php/api.php             API JSON (transactions, objectifs, défis), par compte
assets/                 Captures d'écran utilisées sur la page d'accueil
data/                   Contient la base SQLite générée (ignorée par git)
```
