# Cadence

Application de gestion de budget pensée pour un **athlète de haut niveau** :
revenus irréguliers (sponsoring, primes, aides fédérales), dépenses sportives
spécifiques (coaching, kiné, équipement, déplacements) et besoin de préparer
l'après-carrière.

## Stack

- **Frontend** : HTML / CSS / JavaScript (vanilla, sans dépendance externe)
- **Backend** : PHP (API JSON dans `serveur/api.php`)
- **Stockage** : base **MySQL/MariaDB** (via PDO), schéma relationnel défini
  dans [`database.sql`](database.sql) : une table `users`, et les données
  (`transactions`, `goals`, `challenges`) rattachées à chaque compte par une
  clé étrangère `user_id`.

## Comptes & authentification

Chaque athlète a son propre compte et ses propres données :

- **Inscription** (`inscription.html`) : email + mot de passe (8 caractères
  minimum, hashé avec `password_hash()`), prénom optionnel. Un compte
  nouvellement créé démarre à 0 (aucune transaction, objectif ou défi).
- **Connexion** (`connexion.html`) : email + mot de passe, vérifié avec
  `password_verify()`.
- **Session** : gérée côté serveur avec les sessions PHP natives. `app.php`
  vérifie la session à chaque chargement et redirige vers `connexion.html`
  si l'utilisateur n'est pas connecté ; `serveur/api.php` fait de même pour
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

Prérequis : un serveur PHP 8+ avec l'extension `pdo_mysql`, et un serveur
MySQL/MariaDB avec phpMyAdmin (typiquement fournis par **XAMPP**, **WAMP**
ou **MAMP**).

1. **Importer le schéma** : dans phpMyAdmin, onglet **Importer**, choisis le
   fichier [`database.sql`](database.sql) et valide. Ça crée la base
   `cadence` avec ses 4 tables (`users`, `transactions`, `goals`,
   `challenges`). Tu peux ensuite les parcourir directement dans phpMyAdmin.
2. **Vérifier les identifiants** dans `serveur/config.php` (en haut du fichier) :
   par défaut `localhost` / port `3306` / utilisateur `root` / pas de mot de
   passe, ce qui correspond à une install XAMPP/WAMP standard. Adapte ces
   constantes si ta configuration diffère.
3. **Lancer le serveur PHP** (si ce n'est pas déjà fait par XAMPP/WAMP) :
   ```bash
   php -S localhost:8000
   ```
4. Ouvrir [http://localhost:8000](http://localhost:8000) : la page d'accueil
   propose de créer un compte, ce qui donne accès à un tableau de bord vide,
   prêt à recevoir tes propres données.

## Structure du projet

```
index.html                  Page d'accueil (marketing, non protégée)
inscription.html            Formulaire de création de compte
connexion.html              Formulaire de connexion
app.php                     Application (protégée par session PHP)
styles/style.css            Thème visuel partagé par toutes les pages
styles/landing.css          Styles propres à la page d'accueil
styles/auth.css             Styles propres aux pages inscription/connexion
scripts/app.js              Logique front de l'application (appels API, onglets)
database.sql                Schéma SQL à importer dans phpMyAdmin
serveur/config.php          Connexion PDO à MySQL
serveur/auth.php            Garde de session réutilisée par l'API
serveur/register.php        Endpoint d'inscription
serveur/login.php           Endpoint de connexion
serveur/logout.php          Endpoint de déconnexion
serveur/api.php             API JSON (transactions, objectifs, défis), par compte
ressources/                 Captures d'écran utilisées sur la page d'accueil
```
