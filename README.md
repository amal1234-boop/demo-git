# Podium Budget

Site de gestion de budget conçu pour un persona **athlète de haut niveau** :
revenus irréguliers (sponsoring, primes, aides fédérales), dépenses sportives
spécifiques (coaching, kiné, équipement, déplacements) et besoin de préparer
l'après-carrière. Voir l'onglet **Persona** de l'application pour le détail
du persona et des user stories.

## Stack

- **Frontend** : HTML / CSS / JavaScript (vanilla, sans dépendance externe)
- **Backend** : PHP (API JSON dans `php/api.php`)
- **Stockage** : SQLite via PDO, base créée et pré-remplie automatiquement
  au premier appel (`data/budget.sqlite`)

## Fonctionnalités

- Tableau de bord mensuel (revenus, dépenses, solde, taux d'épargne)
- Répartition des dépenses par catégorie
- Gestion des revenus/dépenses (ajout, suppression, catégories adaptées à un
  sportif de haut niveau)
- Objectifs d'épargne dédiés (fonds de reconversion, fonds blessure, projet
  post-carrière) avec barres de progression façon "piste d'athlétisme"
- Défis d'épargne façon entraînement (séries de jours, badges) pour entretenir
  la motivation

## Lancer le site en local

Prérequis : PHP 8+ avec l'extension `pdo_sqlite` (activée par défaut dans la
plupart des distributions PHP).

```bash
php -S localhost:8000
```

Puis ouvrir [http://localhost:8000](http://localhost:8000) dans le navigateur.

La base de données est créée automatiquement dans `data/budget.sqlite` avec
des données d'exemple (transactions, objectifs, défis) au premier lancement.

## Structure du projet

```
index.html          Page unique (SPA) avec les onglets de navigation
css/style.css        Thème visuel "stade / piste d'athlétisme"
js/app.js            Logique front (appels API, rendu des onglets)
php/config.php       Connexion PDO + création/seed de la base SQLite
php/api.php          API JSON (transactions, objectifs, défis)
data/                Contient la base SQLite générée (ignorée par git)
```
