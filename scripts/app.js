const API = 'serveur/api.php';

const CATEGORIES = {
  revenu: ['Sponsoring', 'Primes de compétition', 'Aide fédération', 'Droits image', 'Stage / coaching rémunéré', 'Autre'],
  depense: ['Équipement sportif', 'Coaching / Préparation physique', 'Kiné / Médical', 'Déplacements compétitions', 'Nutrition / Compléments', 'Logement / Vie quotidienne', 'Autre'],
};

// Petites icônes SVG (style trait fin) utilisées à la place d'émojis dans les
// zones générées dynamiquement — cohérentes avec celles écrites en dur dans app.php.
const ICONS = {
  graduation: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9l10-4 10 4-10 4-10-4z"/><path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/></svg>',
  shield: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="9.5" y1="10.5" x2="14.5" y2="10.5"/></svg>',
  rocket: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c2.5 2 4 5.5 4 9 0 2-1 4-1 4l-3 3-3-3s-1-2-1-4c0-3.5 1.5-7 4-9z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 15l-3 1 1-3M15 15l3 1-1-3"/></svg>',
  target: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
  flame: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 2c.3 3-2.4 4.6-3.6 6.7C7 11 7 13.4 8.4 15c-.6-2 .6-3 1.4-4.3.2 1.6 1 2.2 1.9 3 .8-.7.7-1.6.4-2.4 1.6 1 2.6 2.5 2.6 4.2 0 2.9-2.6 5-5.7 5S3.3 18.4 3.3 15.5c0-4 3.6-6.2 4.9-9.3.9 1 1 2.2.6 3.4C10.3 7.8 11.4 4.9 12 2z"/></svg>',
  trophy: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M5 4H3v2a4 4 0 0 0 4 4"/><path d="M19 4h2v2a4 4 0 0 1-4 4"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="8" y1="19" x2="16" y2="19"/></svg>',
  arrowUp: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></svg>',
  arrowDown: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="18 13 12 19 6 13"/></svg>',
};

// La base ne stocke qu'une clé courte ('graduation', 'shield'...), jamais le
// markup SVG complet — ICONS[clé] fait la conversion au moment de l'affichage.
const GOAL_ICON_KEYS = { reconversion: 'graduation', blessure: 'shield', projet: 'rocket', autre: 'target' };

let currentMonth = new Date().toISOString().slice(0, 7);
let pendingRoundup = 0;

// Le script est chargé avec `defer` : le DOM est déjà entièrement parsé
// quand ce fichier s'exécute, donc on peut mettre les éléments en cache
// une seule fois ici plutôt que de refaire un getElementById à chaque rendu.
const el = {
  tabsNav: document.getElementById('tabs'),
  monthSelector: document.getElementById('monthSelector'),
  dashboardMonthLabel: document.getElementById('dashboardMonthLabel'),

  statRevenus: document.getElementById('statRevenus'),
  statDepenses: document.getElementById('statDepenses'),
  statSolde: document.getElementById('statSolde'),
  statTaux: document.getElementById('statTaux'),

  categoryChart: document.getElementById('categoryChart'),
  categoryEmpty: document.getElementById('categoryEmpty'),
  globalGoalFill: document.getElementById('globalGoalFill'),
  globalGoalMarker: document.getElementById('globalGoalMarker'),
  globalGoalText: document.getElementById('globalGoalText'),

  formGaugeCircle: document.getElementById('formGaugeCircle'),
  formScoreNumber: document.getElementById('formScoreNumber'),
  formScoreLabel: document.getElementById('formScoreLabel'),
  runwayFill: document.getElementById('runwayFill'),
  runwayText: document.getElementById('runwayText'),
  versusCurrentValue: document.getElementById('versusCurrentValue'),
  versusPreviousValue: document.getElementById('versusPreviousValue'),
  versusCurrentSide: document.getElementById('versusCurrentSide'),
  versusPreviousSide: document.getElementById('versusPreviousSide'),
  versusText: document.getElementById('versusText'),

  transactionForm: document.getElementById('transactionForm'),
  txType: document.getElementById('txType'),
  txCategory: document.getElementById('txCategory'),
  txLabel: document.getElementById('txLabel'),
  txAmount: document.getElementById('txAmount'),
  txDate: document.getElementById('txDate'),
  txTableBody: document.getElementById('txTableBody'),
  txEmpty: document.getElementById('txEmpty'),

  roundupCard: document.getElementById('roundupCard'),
  roundupText: document.getElementById('roundupText'),
  roundupGoalSelect: document.getElementById('roundupGoalSelect'),
  roundupSendBtn: document.getElementById('roundupSendBtn'),
  roundupSkipBtn: document.getElementById('roundupSkipBtn'),

  newGoalBtn: document.getElementById('newGoalBtn'),
  goalForm: document.getElementById('goalForm'),
  goalName: document.getElementById('goalName'),
  goalCategory: document.getElementById('goalCategory'),
  goalTarget: document.getElementById('goalTarget'),
  goalDeadline: document.getElementById('goalDeadline'),
  goalsList: document.getElementById('goalsList'),

  challengesList: document.getElementById('challengesList'),
  newChallengeBtn: document.getElementById('newChallengeBtn'),
  challengeForm: document.getElementById('challengeForm'),
  challengeTitle: document.getElementById('challengeTitle'),
  challengeDescription: document.getElementById('challengeDescription'),
  challengeTargetDays: document.getElementById('challengeTargetDays'),

  toast: document.getElementById('toast'),
  logoutBtn: document.getElementById('logoutBtn'),
};

function fmtEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function toast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.toast.hidden = true; }, 2500);
}

async function api(action, { method = 'GET', body } = {}) {
  const url = method === 'GET'
    ? `${API}?action=${action}${body ? '&' + new URLSearchParams(body) : ''}`
    : `${API}?action=${action}`;
  const opts = { method };
  if (method !== 'GET') {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body || {});
  }
  const res = await fetch(url, opts);
  if (res.status === 401) {
    // Session expirée ou absente : plus la peine de continuer, direction connexion.
    window.location.href = 'connexion.html';
    return new Promise(() => {}); // stoppe la chaîne d'appels en attente sans lever d'erreur inutile
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
  return data;
}

// ---------- Tabs ----------
el.tabsNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === btn.dataset.tab));
});

// ---------- Dashboard ----------
async function loadDashboard() {
  const [y, m] = currentMonth.split('-');
  el.dashboardMonthLabel.textContent = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const summary = await api('summary', { body: { month: currentMonth } });

  el.statRevenus.textContent = fmtEuro(summary.revenus);
  el.statDepenses.textContent = fmtEuro(summary.depenses);
  el.statSolde.textContent = fmtEuro(summary.solde);
  el.statTaux.textContent = `${summary.taux_epargne}%`;

  el.categoryChart.innerHTML = '';
  if (!summary.depenses_par_categorie.length) {
    el.categoryEmpty.hidden = false;
  } else {
    el.categoryEmpty.hidden = true;
    const max = Math.max(...summary.depenses_par_categorie.map((c) => c.total));
    for (const c of summary.depenses_par_categorie) {
      const row = document.createElement('li');
      row.className = 'bar-row';
      row.innerHTML = `
        <span class="bar-label" title="${c.category}">${c.category}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${max ? (c.total / max) * 100 : 0}%"></span></span>
        <span class="bar-amount">${fmtEuro(c.total)}</span>`;
      el.categoryChart.appendChild(row);
    }
  }

  const pct = summary.objectifs_total_cible > 0
    ? Math.min(100, (summary.objectifs_total_epargne / summary.objectifs_total_cible) * 100)
    : 0;
  el.globalGoalFill.style.width = `${pct}%`;
  el.globalGoalMarker.style.left = `${pct}%`;
  el.globalGoalText.textContent =
    `${fmtEuro(summary.objectifs_total_epargne)} épargnés sur ${fmtEuro(summary.objectifs_total_cible)} d'objectifs cumulés (${pct.toFixed(1)}%).`;
}

// ---------- Performance features (forme, blessure, versus) ----------
function getPrevMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().slice(0, 7);
}

function renderFormGauge(score) {
  const circumference = 314.159; // doit rester synchronisé avec stroke-dasharray en CSS
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  el.formGaugeCircle.style.strokeDashoffset = offset;

  let color = 'var(--positive)';
  let label = 'Grande forme';
  if (score < 40) { color = 'var(--red)'; label = 'Alerte fatigue financière'; }
  else if (score < 60) { color = 'var(--warning)'; label = 'Rythme à travailler'; }
  else if (score < 80) { color = 'var(--blue)'; label = 'Bonne dynamique'; }

  el.formGaugeCircle.style.stroke = color;
  el.formScoreNumber.textContent = score;
  el.formScoreLabel.textContent = label;
}

function renderRunway(buffer, monthlyBurn) {
  if (monthlyBurn <= 0) {
    el.runwayFill.style.width = buffer > 0 ? '0%' : '100%';
    el.runwayText.textContent = buffer > 0
      ? `Aucune dépense enregistrée ce mois-ci : ton matelas de ${fmtEuro(buffer)} n'est, pour l'instant, entamé par rien.`
      : `Ajoute des dépenses et des objectifs pour activer le simulateur.`;
    return;
  }

  const months = buffer / monthlyBurn;
  const cappedRatio = Math.min(months / 12, 1);
  el.runwayFill.style.width = `${(1 - cappedRatio) * 100}%`;
  el.runwayText.textContent = `Avec ${fmtEuro(buffer)} d'épargne cumulée et ${fmtEuro(monthlyBurn)} de dépenses ce mois-ci, tu tiendrais environ ${months.toFixed(1)} mois sans le moindre revenu.`;
}

function renderVersus(summary, prevSummary) {
  el.versusCurrentSide.classList.remove('winner');
  el.versusPreviousSide.classList.remove('winner');

  const hasPrevData = prevSummary.revenus > 0 || prevSummary.depenses > 0;
  el.versusCurrentValue.textContent = `${summary.taux_epargne}%`;

  if (!hasPrevData) {
    el.versusPreviousValue.textContent = '–';
    el.versusText.textContent = "Pas encore de mois précédent à comparer : reviens le mois prochain pour ton premier match !";
    return;
  }

  el.versusPreviousValue.textContent = `${prevSummary.taux_epargne}%`;

  if (summary.taux_epargne > prevSummary.taux_epargne) {
    el.versusCurrentSide.classList.add('winner');
    el.versusText.textContent = `Tu bats ton mois dernier ! Taux d'épargne en hausse de ${(summary.taux_epargne - prevSummary.taux_epargne).toFixed(1)} point(s).`;
  } else if (summary.taux_epargne < prevSummary.taux_epargne) {
    el.versusPreviousSide.classList.add('winner');
    el.versusText.textContent = `Le mois dernier était plus fort de ${(prevSummary.taux_epargne - summary.taux_epargne).toFixed(1)} point(s). Reprends l'avantage d'ici la fin du mois !`;
  } else {
    el.versusText.textContent = `Match nul : exactement le même taux d'épargne que le mois dernier.`;
  }
}

async function loadPerformance() {
  const [summary, prevSummary, goals, challenges] = await Promise.all([
    api('summary', { body: { month: currentMonth } }),
    api('summary', { body: { month: getPrevMonth(currentMonth) } }),
    api('goals'),
    api('challenges'),
  ]);

  // Score composite : épargne du mois (40%), avancement des objectifs (35%),
  // assiduité sur les défis (25%) — pondération choisie pour que l'épargne
  // récente pèse plus qu'un objectif ancien déjà bien avancé.
  const savingsScore = Math.max(0, Math.min(100, (summary.taux_epargne / 40) * 100));
  const goalsPct = summary.objectifs_total_cible > 0
    ? Math.min(100, (summary.objectifs_total_epargne / summary.objectifs_total_cible) * 100)
    : 0;
  const ratios = challenges.map((c) => Math.min(1, c.progress_days / c.target_days));
  const challengesScore = ratios.length ? (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100 : 0;
  const formScore = Math.round(savingsScore * 0.4 + goalsPct * 0.35 + challengesScore * 0.25);
  renderFormGauge(formScore);

  const buffer = goals.reduce((sum, g) => sum + g.current_amount, 0);
  renderRunway(buffer, summary.depenses);

  renderVersus(summary, prevSummary);
}

// ---------- Transactions ----------
function refreshCategoryOptions() {
  el.txCategory.innerHTML = CATEGORIES[el.txType.value].map((c) => `<option value="${c}">${c}</option>`).join('');
}

async function loadTransactions() {
  const list = await api('transactions', { body: { month: currentMonth } });
  el.txTableBody.innerHTML = '';
  el.txEmpty.hidden = list.length !== 0;

  for (const tx of list) {
    const tr = document.createElement('tr');
    const icon = tx.type === 'revenu' ? ICONS.arrowUp : ICONS.arrowDown;
    tr.innerHTML = `
      <td>${new Date(tx.date).toLocaleDateString('fr-FR')}</td>
      <td><span class="tx-type amount-${tx.type}">${icon} ${tx.type === 'revenu' ? 'Revenu' : 'Dépense'}</span></td>
      <td>${tx.category}</td>
      <td>${tx.label}</td>
      <td class="amount-${tx.type}">${tx.type === 'revenu' ? '+' : '-'}${fmtEuro(tx.amount)}</td>
      <td><button class="btn ghost small" data-del="${tx.id}">✕</button></td>`;
    el.txTableBody.appendChild(tr);
  }

  el.txTableBody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api('delete_transaction', { method: 'POST', body: { id: btn.dataset.del } });
        toast('Opération supprimée');
        await refreshAll();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}

el.txType.addEventListener('change', refreshCategoryOptions);

el.transactionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    type: el.txType.value,
    category: el.txCategory.value,
    label: el.txLabel.value.trim(),
    amount: parseFloat(el.txAmount.value),
    date: el.txDate.value,
  };
  try {
    await api('add_transaction', { method: 'POST', body: payload });
    toast('Opération ajoutée');
    e.target.reset();
    el.txDate.value = new Date().toISOString().slice(0, 10);
    refreshCategoryOptions();
    await refreshAll();
    if (payload.type === 'depense') {
      await maybeOfferRoundup(payload.amount);
    }
  } catch (err) {
    toast(err.message);
  }
});

// ---------- Arrondis d'entraînement ----------
async function maybeOfferRoundup(amount) {
  const roundedTo = Math.ceil(amount / 5) * 5;
  const roundUp = Math.round((roundedTo - amount) * 100) / 100;
  if (roundUp <= 0) return;

  const goals = await api('goals');
  if (!goals.length) return;

  pendingRoundup = roundUp;
  el.roundupGoalSelect.innerHTML = goals.map((g) => `<option value="${g.id}">${g.name}</option>`).join('');
  el.roundupText.textContent =
    `Cette dépense arrondie à ${fmtEuro(roundedTo)} laisse ${fmtEuro(roundUp)} d'écart. Transforme-le en épargne en un clic :`;
  el.roundupCard.hidden = false;
}

el.roundupSendBtn.addEventListener('click', async () => {
  try {
    await api('contribute_goal', { method: 'POST', body: { id: el.roundupGoalSelect.value, amount: pendingRoundup } });
    toast(`+${fmtEuro(pendingRoundup)} envoyés vers ton objectif`);
    el.roundupCard.hidden = true;
    await refreshAll();
  } catch (err) {
    toast(err.message);
  }
});

el.roundupSkipBtn.addEventListener('click', () => {
  el.roundupCard.hidden = true;
});

// ---------- Goals ----------
async function loadGoals() {
  const goals = await api('goals');
  el.goalsList.innerHTML = '';

  for (const g of goals) {
    const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
    const iconKey = g.icon || GOAL_ICON_KEYS[g.category] || 'target';
    const li = document.createElement('li');
    li.innerHTML = `
      <article class="goal-card">
        <h4>${ICONS[iconKey] || ICONS.target} ${g.name}</h4>
        <p class="goal-meta">${g.deadline ? 'Échéance : ' + new Date(g.deadline).toLocaleDateString('fr-FR') : 'Sans échéance fixe'}</p>
        <div class="track-lane">
          <div class="track-fill" style="width:${pct}%"></div>
          <span class="track-marker" style="left:${pct}%"></span>
        </div>
        <p class="goal-progress-text">${fmtEuro(g.current_amount)} / ${fmtEuro(g.target_amount)} (${pct.toFixed(1)}%)</p>
        <div class="goal-actions">
          <label for="contrib-${g.id}" class="sr-only">Montant à verser pour ${g.name}</label>
          <input type="number" min="1" step="1" placeholder="Montant €" id="contrib-${g.id}" data-contrib="${g.id}">
          <button class="btn primary small" data-add="${g.id}">Verser</button>
        </div>
      </article>`;
    el.goalsList.appendChild(li);
  }

  el.goalsList.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const input = el.goalsList.querySelector(`[data-contrib="${btn.dataset.add}"]`);
      const amount = parseFloat(input.value);
      if (!amount || amount <= 0) { toast('Indique un montant valide'); return; }
      try {
        await api('contribute_goal', { method: 'POST', body: { id: btn.dataset.add, amount } });
        toast('Versement enregistré');
        input.value = '';
        await refreshAll();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}

el.newGoalBtn.addEventListener('click', () => {
  el.goalForm.hidden = !el.goalForm.hidden;
});

el.goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: el.goalName.value.trim(),
    category: el.goalCategory.value,
    target_amount: parseFloat(el.goalTarget.value),
    deadline: el.goalDeadline.value || null,
    icon: GOAL_ICON_KEYS[el.goalCategory.value] || 'target',
  };
  try {
    await api('add_goal', { method: 'POST', body: payload });
    toast('Objectif créé');
    e.target.reset();
    e.target.hidden = true;
    await loadGoals();
  } catch (err) {
    toast(err.message);
  }
});

// ---------- Challenges ----------
async function loadChallenges() {
  const challenges = await api('challenges');
  el.challengesList.innerHTML = '';

  for (const c of challenges) {
    const done = c.status === 'termine';
    const dots = Array.from({ length: c.target_days }, (_, i) =>
      `<span class="streak-dot ${i < c.progress_days ? 'filled' : ''}"></span>`
    ).join('');

    const li = document.createElement('li');
    li.innerHTML = `
      <article class="challenge-card">
        <span class="challenge-status ${done ? 'termine' : ''}">${done ? 'Défi terminé' : `${c.progress_days}/${c.target_days}`}</span>
        <h4>${done ? ICONS.trophy : ICONS.flame} ${c.title}</h4>
        <p class="challenge-desc">${c.description || ''}</p>
        <div class="streak-dots">${dots}</div>
        <button class="btn primary small" data-checkin="${c.id}" ${done ? 'disabled' : ''}>
          ${done ? 'Bravo, objectif validé !' : 'Valider aujourd\'hui'}
        </button>
      </article>`;
    el.challengesList.appendChild(li);
  }

  el.challengesList.querySelectorAll('[data-checkin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const res = await api('checkin_challenge', { method: 'POST', body: { id: btn.dataset.checkin } });
        toast(res.challenge.status === 'termine' ? 'Défi terminé, bravo !' : 'Jour validé');
        await refreshAll();
      } catch (err) {
        toast(err.message);
      }
    });
  });
}

el.newChallengeBtn.addEventListener('click', () => {
  el.challengeForm.hidden = !el.challengeForm.hidden;
});

el.challengeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: el.challengeTitle.value.trim(),
    description: el.challengeDescription.value.trim(),
    target_days: parseInt(el.challengeTargetDays.value, 10),
  };
  try {
    await api('add_challenge', { method: 'POST', body: payload });
    toast('Défi créé');
    e.target.reset();
    e.target.hidden = true;
    await loadChallenges();
  } catch (err) {
    toast(err.message);
  }
});

// ---------- Déconnexion ----------
el.logoutBtn.addEventListener('click', async () => {
  await fetch('serveur/deconnexion.php', { method: 'POST' });
  window.location.href = 'index.html';
});

// ---------- Init ----------
async function refreshAll() {
  await Promise.all([loadDashboard(), loadTransactions(), loadGoals(), loadChallenges(), loadPerformance()]);
}

el.monthSelector.addEventListener('change', async (e) => {
  currentMonth = e.target.value;
  await refreshAll();
});

el.monthSelector.value = currentMonth;
el.txDate.value = new Date().toISOString().slice(0, 10);
refreshCategoryOptions();
refreshAll();
