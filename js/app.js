const API = 'php/api.php';

const CATEGORIES = {
  revenu: ['Sponsoring', 'Primes de compétition', 'Aide fédération', 'Droits image', 'Stage / coaching rémunéré', 'Autre'],
  depense: ['Équipement sportif', 'Coaching / Préparation physique', 'Kiné / Médical', 'Déplacements compétitions', 'Nutrition / Compléments', 'Logement / Vie quotidienne', 'Autre'],
};

const GOAL_ICONS = { reconversion: '🎓', blessure: '🩹', projet: '🚀', autre: '🎯' };

let currentMonth = new Date().toISOString().slice(0, 7);

function fmtEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2500);
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
  return data;
}

// ---------- Tabs ----------
document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === btn.dataset.tab));
});

// ---------- Dashboard ----------
async function loadDashboard() {
  const label = document.getElementById('dashboardMonthLabel');
  const [y, m] = currentMonth.split('-');
  label.textContent = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const summary = await api('summary', { body: { month: currentMonth } });

  document.getElementById('statRevenus').textContent = fmtEuro(summary.revenus);
  document.getElementById('statDepenses').textContent = fmtEuro(summary.depenses);
  document.getElementById('statSolde').textContent = fmtEuro(summary.solde);
  document.getElementById('statTaux').textContent = `${summary.taux_epargne}%`;

  const chart = document.getElementById('categoryChart');
  const empty = document.getElementById('categoryEmpty');
  chart.innerHTML = '';
  if (!summary.depenses_par_categorie.length) {
    empty.hidden = false;
  } else {
    empty.hidden = true;
    const max = Math.max(...summary.depenses_par_categorie.map((c) => c.total));
    for (const c of summary.depenses_par_categorie) {
      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = `
        <span class="bar-label" title="${c.category}">${c.category}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${max ? (c.total / max) * 100 : 0}%"></span></span>
        <span class="bar-amount">${fmtEuro(c.total)}</span>`;
      chart.appendChild(row);
    }
  }

  const pct = summary.objectifs_total_cible > 0
    ? Math.min(100, (summary.objectifs_total_epargne / summary.objectifs_total_cible) * 100)
    : 0;
  document.getElementById('globalGoalFill').style.width = `${pct}%`;
  document.getElementById('globalGoalRunner').style.left = `${pct}%`;
  document.getElementById('globalGoalText').textContent =
    `${fmtEuro(summary.objectifs_total_epargne)} épargnés sur ${fmtEuro(summary.objectifs_total_cible)} d'objectifs cumulés (${pct.toFixed(1)}%).`;
}

// ---------- Performance features (forme, blessure, versus) ----------
function getPrevMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().slice(0, 7);
}

function renderFormGauge(score) {
  const circumference = 314.159;
  const circle = document.getElementById('formGaugeCircle');
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  circle.style.strokeDashoffset = offset;

  let color = 'var(--lime)';
  let label = 'Grande forme 💪';
  if (score < 40) { color = 'var(--red)'; label = 'Alerte fatigue financière 🚨'; }
  else if (score < 60) { color = 'var(--gold)'; label = 'Rythme à travailler ⚠️'; }
  else if (score < 80) { color = 'var(--blue)'; label = 'Bonne dynamique 🙂'; }

  circle.style.stroke = color;
  document.getElementById('formScoreNumber').textContent = score;
  document.getElementById('formScoreLabel').textContent = label;
}

function renderRunway(buffer, monthlyBurn) {
  const fill = document.getElementById('runwayFill');
  const text = document.getElementById('runwayText');

  if (monthlyBurn <= 0) {
    fill.style.width = buffer > 0 ? '0%' : '100%';
    text.textContent = buffer > 0
      ? `Aucune dépense enregistrée ce mois-ci : ton matelas de ${fmtEuro(buffer)} n'est, pour l'instant, entamé par rien.`
      : `Ajoute des dépenses et des objectifs pour activer le simulateur.`;
    return;
  }

  const months = buffer / monthlyBurn;
  const cappedRatio = Math.min(months / 12, 1);
  fill.style.width = `${(1 - cappedRatio) * 100}%`;
  text.textContent = `Avec ${fmtEuro(buffer)} d'épargne cumulée et ${fmtEuro(monthlyBurn)} de dépenses ce mois-ci, tu tiendrais environ ${months.toFixed(1)} mois sans le moindre revenu.`;
}

function renderVersus(summary, prevSummary) {
  const curVal = document.getElementById('versusCurrentValue');
  const prevVal = document.getElementById('versusPreviousValue');
  const curSide = document.getElementById('versusCurrentSide');
  const prevSide = document.getElementById('versusPreviousSide');
  const text = document.getElementById('versusText');

  curSide.classList.remove('winner');
  prevSide.classList.remove('winner');

  const hasPrevData = prevSummary.revenus > 0 || prevSummary.depenses > 0;
  curVal.textContent = `${summary.taux_epargne}%`;

  if (!hasPrevData) {
    prevVal.textContent = '–';
    text.textContent = "Pas encore de mois précédent à comparer : reviens le mois prochain pour ton premier match !";
    return;
  }

  prevVal.textContent = `${prevSummary.taux_epargne}%`;

  if (summary.taux_epargne > prevSummary.taux_epargne) {
    curSide.classList.add('winner');
    text.textContent = `Tu bats ton mois dernier ! Taux d'épargne en hausse de ${(summary.taux_epargne - prevSummary.taux_epargne).toFixed(1)} point(s). 🏆`;
  } else if (summary.taux_epargne < prevSummary.taux_epargne) {
    prevSide.classList.add('winner');
    text.textContent = `Le mois dernier était plus fort de ${(prevSummary.taux_epargne - summary.taux_epargne).toFixed(1)} point(s). Reprends l'avantage d'ici la fin du mois !`;
  } else {
    text.textContent = `Match nul : exactement le même taux d'épargne que le mois dernier.`;
  }
}

async function loadPerformance() {
  const [summary, prevSummary, goals, challenges] = await Promise.all([
    api('summary', { body: { month: currentMonth } }),
    api('summary', { body: { month: getPrevMonth(currentMonth) } }),
    api('goals'),
    api('challenges'),
  ]);

  const savingsScore = Math.max(0, Math.min(100, (summary.taux_epargne / 40) * 100));
  const goalsPct = summary.objectifs_total_cible > 0
    ? Math.min(100, (summary.objectifs_total_epargne / summary.objectifs_total_cible) * 100)
    : 0;
  const ratios = challenges.map((c) => Math.min(1, c.progress_days / c.target_days));
  const challengesScore = ratios.length ? (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100 : 50;
  const formScore = Math.round(savingsScore * 0.4 + goalsPct * 0.35 + challengesScore * 0.25);
  renderFormGauge(formScore);

  const buffer = goals.reduce((sum, g) => sum + g.current_amount, 0);
  renderRunway(buffer, summary.depenses);

  renderVersus(summary, prevSummary);
}

// ---------- Transactions ----------
function refreshCategoryOptions() {
  const type = document.getElementById('txType').value;
  const select = document.getElementById('txCategory');
  select.innerHTML = CATEGORIES[type].map((c) => `<option value="${c}">${c}</option>`).join('');
}

async function loadTransactions() {
  const list = await api('transactions', { body: { month: currentMonth } });
  const tbody = document.getElementById('txTableBody');
  const empty = document.getElementById('txEmpty');
  tbody.innerHTML = '';
  empty.hidden = list.length !== 0;

  for (const tx of list) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(tx.date).toLocaleDateString('fr-FR')}</td>
      <td>${tx.type === 'revenu' ? '💰 Revenu' : '💸 Dépense'}</td>
      <td>${tx.category}</td>
      <td>${tx.label}</td>
      <td class="amount-${tx.type}">${tx.type === 'revenu' ? '+' : '-'}${fmtEuro(tx.amount)}</td>
      <td><button class="btn ghost small" data-del="${tx.id}">✕</button></td>`;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api('delete_transaction', { method: 'POST', body: { id: btn.dataset.del } });
      toast('Opération supprimée');
      await Promise.all([loadTransactions(), loadDashboard(), loadPerformance()]);
    });
  });
}

document.getElementById('txType').addEventListener('change', refreshCategoryOptions);

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    type: document.getElementById('txType').value,
    category: document.getElementById('txCategory').value,
    label: document.getElementById('txLabel').value.trim(),
    amount: parseFloat(document.getElementById('txAmount').value),
    date: document.getElementById('txDate').value,
  };
  try {
    await api('add_transaction', { method: 'POST', body: payload });
    toast('Opération ajoutée 🎯');
    e.target.reset();
    document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
    refreshCategoryOptions();
    await Promise.all([loadTransactions(), loadDashboard(), loadPerformance()]);
    if (payload.type === 'depense') {
      await maybeOfferRoundup(payload.amount);
    }
  } catch (err) {
    toast(err.message);
  }
});

// ---------- Arrondis d'entraînement ----------
let pendingRoundup = 0;

async function maybeOfferRoundup(amount) {
  const roundedTo = Math.ceil(amount / 5) * 5;
  const roundUp = Math.round((roundedTo - amount) * 100) / 100;
  if (roundUp <= 0) return;

  const goals = await api('goals');
  if (!goals.length) return;

  pendingRoundup = roundUp;
  const sel = document.getElementById('roundupGoalSelect');
  sel.innerHTML = goals.map((g) => `<option value="${g.id}">${g.icon || '🎯'} ${g.name}</option>`).join('');
  document.getElementById('roundupText').textContent =
    `Cette dépense arrondie à ${fmtEuro(roundedTo)} laisse ${fmtEuro(roundUp)} d'écart. Transforme-le en épargne en un clic :`;
  document.getElementById('roundupCard').hidden = false;
}

document.getElementById('roundupSendBtn').addEventListener('click', async () => {
  const goalId = document.getElementById('roundupGoalSelect').value;
  try {
    await api('contribute_goal', { method: 'POST', body: { id: goalId, amount: pendingRoundup } });
    toast(`+${fmtEuro(pendingRoundup)} envoyés vers ton objectif 🔁`);
    document.getElementById('roundupCard').hidden = true;
    await Promise.all([loadGoals(), loadDashboard(), loadPerformance()]);
  } catch (err) {
    toast(err.message);
  }
});

document.getElementById('roundupSkipBtn').addEventListener('click', () => {
  document.getElementById('roundupCard').hidden = true;
});

// ---------- Goals ----------
async function loadGoals() {
  const goals = await api('goals');
  const wrap = document.getElementById('goalsList');
  wrap.innerHTML = '';

  for (const g of goals) {
    const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
    const div = document.createElement('div');
    div.className = 'goal-card';
    div.innerHTML = `
      <h4>${g.icon || GOAL_ICONS[g.category] || '🎯'} ${g.name}</h4>
      <p class="goal-meta">${g.deadline ? 'Échéance : ' + new Date(g.deadline).toLocaleDateString('fr-FR') : 'Sans échéance fixe'}</p>
      <div class="track-lane">
        <div class="track-fill" style="width:${pct}%"></div>
        <span class="track-runner" style="left:${pct}%">🏃</span>
      </div>
      <p class="goal-progress-text">${fmtEuro(g.current_amount)} / ${fmtEuro(g.target_amount)} (${pct.toFixed(1)}%)</p>
      <div class="goal-actions">
        <input type="number" min="1" step="1" placeholder="Montant €" data-contrib="${g.id}">
        <button class="btn primary small" data-add="${g.id}">Verser</button>
      </div>`;
    wrap.appendChild(div);
  }

  wrap.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const input = wrap.querySelector(`[data-contrib="${btn.dataset.add}"]`);
      const amount = parseFloat(input.value);
      if (!amount || amount <= 0) { toast('Indique un montant valide'); return; }
      await api('contribute_goal', { method: 'POST', body: { id: btn.dataset.add, amount } });
      toast('Versement enregistré 🏅');
      input.value = '';
      await Promise.all([loadGoals(), loadDashboard(), loadPerformance()]);
    });
  });
}

document.getElementById('newGoalBtn').addEventListener('click', () => {
  const form = document.getElementById('goalForm');
  form.hidden = !form.hidden;
});

document.getElementById('goalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('goalName').value.trim(),
    category: document.getElementById('goalCategory').value,
    target_amount: parseFloat(document.getElementById('goalTarget').value),
    deadline: document.getElementById('goalDeadline').value || null,
    icon: GOAL_ICONS[document.getElementById('goalCategory').value] || '🎯',
  };
  try {
    await api('add_goal', { method: 'POST', body: payload });
    toast('Objectif créé 🚀');
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
  const wrap = document.getElementById('challengesList');
  wrap.innerHTML = '';

  for (const c of challenges) {
    const done = c.status === 'termine';
    const dots = Array.from({ length: c.target_days }, (_, i) =>
      `<span class="streak-dot ${i < c.progress_days ? 'filled' : ''}"></span>`
    ).join('');

    const div = document.createElement('div');
    div.className = 'challenge-card';
    div.innerHTML = `
      <span class="challenge-status ${done ? 'termine' : ''}">${done ? 'Défi terminé 🏆' : `${c.progress_days}/${c.target_days}`}</span>
      <h4>${c.badge || '🔥'} ${c.title}</h4>
      <p class="challenge-desc">${c.description || ''}</p>
      <div class="streak-dots">${dots}</div>
      <button class="btn primary small" data-checkin="${c.id}" ${done ? 'disabled' : ''}>
        ${done ? 'Bravo, objectif validé !' : 'Valider aujourd\'hui'}
      </button>`;
    wrap.appendChild(div);
  }

  wrap.querySelectorAll('[data-checkin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const res = await api('checkin_challenge', { method: 'POST', body: { id: btn.dataset.checkin } });
        toast(res.challenge.status === 'termine' ? 'Défi terminé, bravo champion(ne) ! 🏆' : 'Jour validé 🔥');
        await Promise.all([loadChallenges(), loadPerformance()]);
      } catch (err) {
        toast(err.message);
      }
    });
  });
}

// ---------- Init ----------
async function refreshAll() {
  await Promise.all([loadDashboard(), loadTransactions(), loadGoals(), loadChallenges(), loadPerformance()]);
}

document.getElementById('monthSelector').addEventListener('change', async (e) => {
  currentMonth = e.target.value;
  await Promise.all([loadDashboard(), loadTransactions(), loadPerformance()]);
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('monthSelector').value = currentMonth;
  document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
  refreshCategoryOptions();
  refreshAll();
});
