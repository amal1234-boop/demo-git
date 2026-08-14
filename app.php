<?php
declare(strict_types=1);
session_start();

// Page protégée : on redirige vers la connexion avant tout rendu HTML si
// aucune session utilisateur n'est active.
if (empty($_SESSION['user_id'])) {
    header('Location: connexion.html');
    exit;
}

$userEmail = $_SESSION['user_email'] ?? '';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cadence — Gestion budgétaire pour athlète de haut niveau</title>
<link rel="stylesheet" href="styles/style.css">
</head>
<body>

<header class="topbar">
  <a class="brand" href="index.html" aria-label="Retour à l'accueil Cadence">
    <svg class="logo-mark" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2.4"/>
      <path d="M9 18l4.5-6.5L17 15l6-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div>
      <h1>Cadence</h1>
      <p class="tagline">La rigueur de l'entraînement, appliquée à ton argent</p>
    </div>
  </a>
  <nav class="tabs" id="tabs">
    <button class="tab-btn active" data-tab="dashboard">Tableau de bord</button>
    <button class="tab-btn" data-tab="transactions">Revenus &amp; Dépenses</button>
    <button class="tab-btn" data-tab="objectifs">Objectifs</button>
    <button class="tab-btn" data-tab="defis">Défis</button>
  </nav>
  <div class="account-box">
    <span class="account-email"><?= htmlspecialchars($userEmail, ENT_QUOTES, 'UTF-8') ?></span>
    <button type="button" class="btn ghost small" id="logoutBtn">Déconnexion</button>
  </div>
</header>

<main>

  <!-- DASHBOARD -->
  <section id="dashboard" class="tab-panel active">
    <div class="dashboard-banner">
      <img class="dashboard-illustration" src="ressources/hero-illustration.png" alt="" aria-hidden="true">
      <div class="panel-header">
        <h2>Tableau de bord — <span id="dashboardMonthLabel"></span></h2>
        <div class="month-picker">
          <label for="monthSelector">Mois :</label>
          <input type="month" id="monthSelector">
        </div>
      </div>
    </div>

    <dl class="stat-grid">
      <div class="stat-card revenu">
        <dt class="stat-label">Revenus du mois</dt>
        <dd class="stat-value" id="statRevenus">0 €</dd>
      </div>
      <div class="stat-card depense">
        <dt class="stat-label">Dépenses du mois</dt>
        <dd class="stat-value" id="statDepenses">0 €</dd>
      </div>
      <div class="stat-card solde">
        <dt class="stat-label">Solde</dt>
        <dd class="stat-value" id="statSolde">0 €</dd>
      </div>
      <div class="stat-card taux">
        <dt class="stat-label">Taux d'épargne</dt>
        <dd class="stat-value" id="statTaux">0 %</dd>
      </div>
    </dl>

    <div class="dashboard-columns">
      <div class="card">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="18" y1="20" x2="18" y2="14"/></svg>
          Répartition des dépenses
        </h3>
        <ul id="categoryChart" class="bar-chart"></ul>
        <p class="empty-hint" id="categoryEmpty" hidden>Aucune dépense enregistrée ce mois-ci.</p>
      </div>

      <div class="card">
        <h3>Progression globale des objectifs</h3>
        <div class="track-lane">
          <div class="track-fill" id="globalGoalFill"></div>
          <span class="track-marker" id="globalGoalMarker"></span>
        </div>
        <p id="globalGoalText" class="track-caption"></p>
      </div>
    </div>

    <div class="dashboard-columns">
      <div class="card gauge-card">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2,13 7,13 9,7 13,19 15,10 17,13 22,13"/></svg>
          Forme financière
        </h3>
        <p class="subtitle">Ton score de forme, calculé comme une charge d'entraînement : épargne, objectifs et défis combinés.</p>
        <div class="gauge-wrap">
          <svg class="gauge-svg" viewBox="0 0 120 120" role="img" aria-label="Jauge de forme financière">
            <circle class="gauge-bg" cx="60" cy="60" r="50"></circle>
            <circle class="gauge-value" id="formGaugeCircle" cx="60" cy="60" r="50"></circle>
          </svg>
          <div class="gauge-center">
            <span class="gauge-number" id="formScoreNumber">–</span>
            <span class="gauge-sub">/100</span>
          </div>
        </div>
        <p class="track-caption" id="formScoreLabel"></p>
      </div>

      <div class="card">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="9.5" y1="10.5" x2="14.5" y2="10.5"/></svg>
          Simulateur résistance blessure
        </h3>
        <p class="subtitle">Si une blessure ou une contre-performance coupait tes revenus dès demain...</p>
        <div class="fuel-gauge">
          <div class="fuel-fill" id="runwayFill"></div>
        </div>
        <p class="track-caption" id="runwayText"></p>
      </div>
    </div>

    <div class="card versus-card">
      <h3>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="8 4 4 8 8 12"/><line x1="4" y1="8" x2="20" y2="8"/><polyline points="16 12 20 16 16 20"/><line x1="20" y1="16" x2="4" y2="16"/></svg>
        Toi vs Toi — match du mois
      </h3>
      <div class="versus-row">
        <div class="versus-side" id="versusCurrentSide">
          <span class="versus-label">Ce mois</span>
          <span class="versus-value" id="versusCurrentValue">–</span>
        </div>
        <span class="versus-vs">VS</span>
        <div class="versus-side" id="versusPreviousSide">
          <span class="versus-label">Mois dernier</span>
          <span class="versus-value" id="versusPreviousValue">–</span>
        </div>
      </div>
      <p class="track-caption" id="versusText"></p>
    </div>
  </section>

  <!-- TRANSACTIONS -->
  <section id="transactions" class="tab-panel">
    <div class="panel-header">
      <h2>Revenus &amp; Dépenses</h2>
    </div>

    <form id="transactionForm" class="card form-grid">
      <div class="field">
        <label for="txType">Type</label>
        <select id="txType" required>
          <option value="revenu">Revenu</option>
          <option value="depense">Dépense</option>
        </select>
      </div>
      <div class="field">
        <label for="txCategory">Catégorie</label>
        <select id="txCategory" required></select>
      </div>
      <div class="field">
        <label for="txLabel">Libellé</label>
        <input type="text" id="txLabel" placeholder="Ex : Prime podium championnat" required>
      </div>
      <div class="field">
        <label for="txAmount">Montant (€)</label>
        <input type="number" id="txAmount" min="0.01" step="0.01" required>
      </div>
      <div class="field">
        <label for="txDate">Date</label>
        <input type="date" id="txDate" required>
      </div>
      <button type="submit" class="btn primary">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter
      </button>
    </form>

    <div class="card roundup-card" id="roundupCard" hidden>
      <h3>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><polyline points="20 4 20 11 13 11"/></svg>
        Arrondi d'entraînement
      </h3>
      <p id="roundupText"></p>
      <div class="goal-actions">
        <label for="roundupGoalSelect" class="sr-only">Objectif qui recevra l'arrondi</label>
        <select id="roundupGoalSelect"></select>
        <button type="button" class="btn primary small" id="roundupSendBtn">Envoyer l'arrondi</button>
        <button type="button" class="btn ghost small" id="roundupSkipBtn">Ignorer</button>
      </div>
    </div>

    <div class="card">
      <table class="tx-table">
        <thead>
          <tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Libellé</th><th>Montant</th><th>Action</th></tr>
        </thead>
        <tbody id="txTableBody"></tbody>
      </table>
      <p class="empty-hint" id="txEmpty" hidden>Aucune opération ce mois-ci.</p>
    </div>
  </section>

  <!-- OBJECTIFS -->
  <section id="objectifs" class="tab-panel">
    <div class="panel-header">
      <h2>Objectifs d'épargne</h2>
      <button class="btn primary" id="newGoalBtn">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvel objectif
      </button>
    </div>

    <form id="goalForm" class="card form-grid" hidden>
      <div class="field">
        <label for="goalName">Nom de l'objectif</label>
        <input type="text" id="goalName" placeholder="Ex : Fonds reconversion" required>
      </div>
      <div class="field">
        <label for="goalCategory">Catégorie</label>
        <select id="goalCategory">
          <option value="reconversion">Reconversion</option>
          <option value="blessure">Fonds blessure / coup dur</option>
          <option value="projet">Projet post-carrière</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div class="field">
        <label for="goalTarget">Montant cible (€)</label>
        <input type="number" id="goalTarget" min="1" step="1" required>
      </div>
      <div class="field">
        <label for="goalDeadline">Échéance (optionnel)</label>
        <input type="date" id="goalDeadline">
      </div>
      <button type="submit" class="btn primary">Créer l'objectif</button>
    </form>

    <ul id="goalsList" class="goals-list"></ul>
  </section>

  <!-- DEFIS -->
  <section id="defis" class="tab-panel">
    <div class="panel-header">
      <h2>Défis d'épargne</h2>
      <p class="subtitle">Comme à l'entraînement : un défi validé, c'est une répétition de plus vers l'objectif.</p>
      <button class="btn primary" id="newChallengeBtn">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau défi
      </button>
    </div>

    <form id="challengeForm" class="card form-grid" hidden>
      <div class="field">
        <label for="challengeTitle">Titre du défi</label>
        <input type="text" id="challengeTitle" placeholder="Ex : Semaine sans dépense superflue" required>
      </div>
      <div class="field">
        <label for="challengeDescription">Description (optionnel)</label>
        <input type="text" id="challengeDescription" placeholder="Ex : Ne rien dépenser en extra pendant 7 jours">
      </div>
      <div class="field">
        <label for="challengeTargetDays">Durée (jours)</label>
        <input type="number" id="challengeTargetDays" min="1" step="1" required>
      </div>
      <button type="submit" class="btn primary">Créer le défi</button>
    </form>

    <ul id="challengesList" class="challenges-list"></ul>
  </section>

</main>

<footer class="site-footer">
  <p>Cadence — l'application budget pensée pour les athlètes de haut niveau.</p>
</footer>

<div id="toast" class="toast" hidden></div>

<script src="scripts/app.js" defer></script>
</body>
</html>
