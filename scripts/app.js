const API = 'serveur/api.php';

const CATEGORIES = {
  revenu: ['Sponsoring', 'Primes de compétition', 'Aide fédération', 'Droits image', 'Stage / coaching rémunéré', 'Autre'],
  depense: ['Équipement sportif', 'Coaching / Préparation physique', 'Kiné / Médical', 'Déplacements compétitions', 'Nutrition / Compléments', 'Logement / Vie quotidienne', 'Autre'],
};

// Petites icônes SVG (style trait fin) utilisées à la place d'émojis dans les
// zones générées dynamiquement — cohérentes avec celles écrites en dur dans app.php.
const ICONES = {
  diplome: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9l10-4 10 4-10 4-10-4z"/><path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/></svg>',
  bouclier: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="9.5" y1="10.5" x2="14.5" y2="10.5"/></svg>',
  fusee: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c2.5 2 4 5.5 4 9 0 2-1 4-1 4l-3 3-3-3s-1-2-1-4c0-3.5 1.5-7 4-9z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 15l-3 1 1-3M15 15l3 1-1-3"/></svg>',
  cible: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
  flamme: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 2c.3 3-2.4 4.6-3.6 6.7C7 11 7 13.4 8.4 15c-.6-2 .6-3 1.4-4.3.2 1.6 1 2.2 1.9 3 .8-.7.7-1.6.4-2.4 1.6 1 2.6 2.5 2.6 4.2 0 2.9-2.6 5-5.7 5S3.3 18.4 3.3 15.5c0-4 3.6-6.2 4.9-9.3.9 1 1 2.2.6 3.4C10.3 7.8 11.4 4.9 12 2z"/></svg>',
  trophee: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M5 4H3v2a4 4 0 0 0 4 4"/><path d="M19 4h2v2a4 4 0 0 1-4 4"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="8" y1="19" x2="16" y2="19"/></svg>',
  fleche_haut: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></svg>',
  fleche_bas: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="18 13 12 19 6 13"/></svg>',
};

// La base ne stocke qu'une clé courte ('diplome', 'bouclier'...), jamais le
// markup SVG complet — ICONES[clé] fait la conversion au moment de l'affichage.
const CLES_ICONE_OBJECTIF = { reconversion: 'diplome', blessure: 'bouclier', projet: 'fusee', autre: 'cible' };

let mois_courant = new Date().toISOString().slice(0, 7);
let arrondi_en_attente = 0;

// Le script est chargé avec `defer` : le DOM est déjà entièrement parsé
// quand ce fichier s'exécute, donc on peut mettre les éléments en cache
// une seule fois ici plutôt que de refaire un getElementById à chaque rendu.
const el = {
  nav_onglets: document.getElementById('onglets'),
  selecteur_mois: document.getElementById('selecteur_mois'),
  libelle_mois: document.getElementById('libelle_mois'),
  stat_revenus: document.getElementById('stat_revenus'),
  stat_depenses: document.getElementById('stat_depenses'),
  stat_solde: document.getElementById('stat_solde'),
  stat_taux: document.getElementById('stat_taux'),
  graphique_categories: document.getElementById('graphique_categories'),
  categories_vide: document.getElementById('categories_vide'),
  remplissage_objectif_global: document.getElementById('remplissage_objectif_global'),
  marqueur_objectif_global: document.getElementById('marqueur_objectif_global'),
  texte_objectif_global: document.getElementById('texte_objectif_global'),
  cercle_jauge_forme: document.getElementById('cercle_jauge_forme'),
  nombre_score_forme: document.getElementById('nombre_score_forme'),
  libelle_score_forme: document.getElementById('libelle_score_forme'),
  remplissage_autonomie: document.getElementById('remplissage_autonomie'),
  texte_autonomie: document.getElementById('texte_autonomie'),
  valeur_versus_actuel: document.getElementById('valeur_versus_actuel'),
  valeur_versus_precedent: document.getElementById('valeur_versus_precedent'),
  cote_versus_actuel: document.getElementById('cote_versus_actuel'),
  cote_versus_precedent: document.getElementById('cote_versus_precedent'),
  texte_versus: document.getElementById('texte_versus'),
  formulaire_operation: document.getElementById('formulaire_operation'),
  type_operation: document.getElementById('type_operation'),
  categorie_operation: document.getElementById('categorie_operation'),
  libelle_operation: document.getElementById('libelle_operation'),
  montant_operation: document.getElementById('montant_operation'),
  date_operation: document.getElementById('date_operation'),
  corps_tableau_operations: document.getElementById('corps_tableau_operations'),
  operations_vide: document.getElementById('operations_vide'),
  carte_arrondi: document.getElementById('carte_arrondi'),
  texte_arrondi: document.getElementById('texte_arrondi'),
  select_objectif_arrondi: document.getElementById('select_objectif_arrondi'),
  bouton_envoyer_arrondi: document.getElementById('bouton_envoyer_arrondi'),
  bouton_ignorer_arrondi: document.getElementById('bouton_ignorer_arrondi'),
  bouton_nouvel_objectif: document.getElementById('bouton_nouvel_objectif'),
  formulaire_objectif: document.getElementById('formulaire_objectif'),
  nom_objectif: document.getElementById('nom_objectif'),
  categorie_objectif: document.getElementById('categorie_objectif'),
  cible_objectif: document.getElementById('cible_objectif'),
  echeance_objectif: document.getElementById('echeance_objectif'),
  liste_objectifs: document.getElementById('liste_objectifs'),
  liste_defis: document.getElementById('liste_defis'),
  bouton_nouveau_defi: document.getElementById('bouton_nouveau_defi'),
  formulaire_defi: document.getElementById('formulaire_defi'),
  titre_defi: document.getElementById('titre_defi'),
  description_defi: document.getElementById('description_defi'),
  jours_cible_defi: document.getElementById('jours_cible_defi'),
  notification: document.getElementById('notification'),
  bouton_deconnexion: document.getElementById('bouton_deconnexion'),
};

function fmtEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

function notifier(msg) {
  el.notification.textContent = msg;
  el.notification.hidden = false;
  clearTimeout(notifier._t);
  notifier._t = setTimeout(() => { el.notification.hidden = true; }, 2500);
}

async function api(action, methode = 'GET', corps) {
  let url = `${API}?action=${action}`;
  if (methode === 'GET') {
    if (corps) {
      for (const cle in corps) {
        url += '&' + encodeURIComponent(cle) + '=' + encodeURIComponent(corps[cle]);
      }
    }
  }
  const options = { method: methode };
  if (methode !== 'GET') {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(corps || {});
  }
  const res = await fetch(url, options);
  if (res.status === 401) {
    // Session expirée ou absente : on redirige vers la connexion.
    window.location.href = 'connexion.html';
    return {};
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erreur || 'Erreur inconnue');
  return data;
}

// ---------- Onglets ----------
el.nav_onglets.addEventListener('click', (e) => {
  const bouton = e.target;
  if (!bouton.classList.contains('tab-btn')) return;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === bouton));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === bouton.getAttribute('data-tab')));
});

// ---------- Tableau de bord ----------
async function chargerTableauBord() {
  const [a, m] = mois_courant.split('-');
  el.libelle_mois.textContent = new Date(Number(a), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const resume = await api('resume', 'GET', { mois: mois_courant });

  el.stat_revenus.textContent = fmtEuro(resume.revenus);
  el.stat_depenses.textContent = fmtEuro(resume.depenses);
  el.stat_solde.textContent = fmtEuro(resume.solde);
  el.stat_taux.textContent = `${resume.taux_epargne}%`;

  el.graphique_categories.innerHTML = '';
  if (!resume.depenses_par_categorie.length) {
    el.categories_vide.hidden = false;
  } else {
    el.categories_vide.hidden = true;
    let max = 0;
    for (const c of resume.depenses_par_categorie) {
      if (c.total > max) max = c.total;
    }
    for (const c of resume.depenses_par_categorie) {
      const ligne = document.createElement('li');
      ligne.className = 'bar-row';
      ligne.innerHTML = `
        <span class="bar-label" title="${c.categorie}">${c.categorie}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${max ? (c.total / max) * 100 : 0}%"></span></span>
        <span class="bar-amount">${fmtEuro(c.total)}</span>`;
      el.graphique_categories.appendChild(ligne);
    }
  }

  const pct = resume.objectifs_total_cible > 0
    ? Math.min(100, (resume.objectifs_total_epargne / resume.objectifs_total_cible) * 100)
    : 0;
  el.remplissage_objectif_global.style.width = `${pct}%`;
  el.marqueur_objectif_global.style.left = `${pct}%`;
  el.texte_objectif_global.textContent =
    `${fmtEuro(resume.objectifs_total_epargne)} épargnés sur ${fmtEuro(resume.objectifs_total_cible)} d'objectifs cumulés (${pct.toFixed(1)}%).`;
}

// ---------- Performance features (forme, blessure, versus) ----------
function moisPrecedent(mois) {
  const [a, m] = mois.split('-');
  const d = new Date(Number(a), Number(m) - 2, 1);
  return d.toISOString().slice(0, 7);
}

function afficherJaugeForme(score) {
  const circonference = 314.159; // doit rester synchronisé avec stroke-dasharray en CSS
  const decalage = circonference * (1 - Math.max(0, Math.min(100, score)) / 100);
  el.cercle_jauge_forme.style.strokeDashoffset = decalage;

  let couleur = 'var(--positive)';
  let libelle = 'Grande forme';
  if (score < 40) { couleur = 'var(--red)'; libelle = 'Alerte fatigue financière'; }
  else if (score < 60) { couleur = 'var(--warning)'; libelle = 'Rythme à travailler'; }
  else if (score < 80) { couleur = 'var(--blue)'; libelle = 'Bonne dynamique'; }

  el.cercle_jauge_forme.style.stroke = couleur;
  el.nombre_score_forme.textContent = score;
  el.libelle_score_forme.textContent = libelle;
}

function afficherAutonomie(matelas, depensesMensuelles) {
  if (depensesMensuelles <= 0) {
    el.remplissage_autonomie.style.width = matelas > 0 ? '0%' : '100%';
    el.texte_autonomie.textContent = matelas > 0
      ? `Aucune dépense enregistrée ce mois-ci : ton matelas de ${fmtEuro(matelas)} n'est, pour l'instant, entamé par rien.`
      : `Ajoute des dépenses et des objectifs pour activer le simulateur.`;
    return;
  }

  const mois = matelas / depensesMensuelles;
  const ratioPlafonne = Math.min(mois / 12, 1);
  el.remplissage_autonomie.style.width = `${(1 - ratioPlafonne) * 100}%`;
  el.texte_autonomie.textContent = `Avec ${fmtEuro(matelas)} d'épargne cumulée et ${fmtEuro(depensesMensuelles)} de dépenses ce mois-ci, tu tiendrais environ ${mois.toFixed(1)} mois sans le moindre revenu.`;
}

function afficherVersus(resume, resumePrecedent) {
  el.cote_versus_actuel.classList.remove('winner');
  el.cote_versus_precedent.classList.remove('winner');

  const aDonneesPrecedentes = resumePrecedent.revenus > 0 || resumePrecedent.depenses > 0;
  el.valeur_versus_actuel.textContent = `${resume.taux_epargne}%`;

  if (!aDonneesPrecedentes) {
    el.valeur_versus_precedent.textContent = '–';
    el.texte_versus.textContent = "Pas encore de mois précédent à comparer : reviens le mois prochain pour ton premier match !";
    return;
  }

  el.valeur_versus_precedent.textContent = `${resumePrecedent.taux_epargne}%`;

  if (resume.taux_epargne > resumePrecedent.taux_epargne) {
    el.cote_versus_actuel.classList.add('winner');
    el.texte_versus.textContent = `Tu bats ton mois dernier ! Taux d'épargne en hausse de ${(resume.taux_epargne - resumePrecedent.taux_epargne).toFixed(1)} point(s).`;
  } else if (resume.taux_epargne < resumePrecedent.taux_epargne) {
    el.cote_versus_precedent.classList.add('winner');
    el.texte_versus.textContent = `Le mois dernier était plus fort de ${(resumePrecedent.taux_epargne - resume.taux_epargne).toFixed(1)} point(s). Reprends l'avantage d'ici la fin du mois !`;
  } else {
    el.texte_versus.textContent = `Match nul : exactement le même taux d'épargne que le mois dernier.`;
  }
}

async function chargerPerformance() {
  const resume = await api('resume', 'GET', { mois: mois_courant });
  const resumePrecedent = await api('resume', 'GET', { mois: moisPrecedent(mois_courant) });
  const objectifs = await api('objectifs');
  const defis = await api('defis');

  // Score composite : épargne du mois (40%), avancement des objectifs (35%),
  // assiduité sur les défis (25%) — pondération choisie pour que l'épargne
  // récente pèse plus qu'un objectif ancien déjà bien avancé.
  const scoreEpargne = Math.max(0, Math.min(100, (resume.taux_epargne / 40) * 100));
  const pctObjectifs = resume.objectifs_total_cible > 0
    ? Math.min(100, (resume.objectifs_total_epargne / resume.objectifs_total_cible) * 100)
    : 0;
  let sommeRatios = 0;
  for (const d of defis) {
    sommeRatios += Math.min(1, d.jours_valides / d.jours_cible);
  }
  const scoreDefis = defis.length ? (sommeRatios / defis.length) * 100 : 0;
  const scoreForme = Math.round(scoreEpargne * 0.4 + pctObjectifs * 0.35 + scoreDefis * 0.25);
  afficherJaugeForme(scoreForme);

  let matelas = 0;
  for (const o of objectifs) {
    matelas += o.montant_actuel;
  }
  afficherAutonomie(matelas, resume.depenses);

  afficherVersus(resume, resumePrecedent);
}

// ---------- Transactions ----------
function rafraichirOptionsCategorie() {
  el.categorie_operation.innerHTML = '';
  for (const c of CATEGORIES[el.type_operation.value]) {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    el.categorie_operation.appendChild(option);
  }
}

async function chargerTransactions() {
  const liste = await api('transactions', 'GET', { mois: mois_courant });
  el.corps_tableau_operations.innerHTML = '';
  el.operations_vide.hidden = liste.length !== 0;

  for (const operation of liste) {
    const ligne = document.createElement('tr');
    const icone = operation.type === 'revenu' ? ICONES.fleche_haut : ICONES.fleche_bas;
    ligne.innerHTML = `
      <td>${new Date(operation.date).toLocaleDateString('fr-FR')}</td>
      <td><span class="tx-type amount-${operation.type}">${icone} ${operation.type === 'revenu' ? 'Revenu' : 'Dépense'}</span></td>
      <td>${operation.categorie}</td>
      <td>${operation.libelle}</td>
      <td class="amount-${operation.type}">${operation.type === 'revenu' ? '+' : '-'}${fmtEuro(operation.montant)}</td>
      <td><button class="btn ghost small" data-suppr="${operation.id}">✕</button></td>`;
    el.corps_tableau_operations.appendChild(ligne);
  }

  el.corps_tableau_operations.querySelectorAll('[data-suppr]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      try {
        await api('supprimer_transaction', 'POST', { id: bouton.getAttribute('data-suppr') });
        notifier('Opération supprimée');
        await toutRafraichir();
      } catch (err) {
        notifier(err.message);
      }
    });
  });
}

el.type_operation.addEventListener('change', rafraichirOptionsCategorie);

el.formulaire_operation.addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = {
    type: el.type_operation.value,
    categorie: el.categorie_operation.value,
    libelle: el.libelle_operation.value.trim(),
    montant: parseFloat(el.montant_operation.value),
    date: el.date_operation.value,
  };
  try {
    await api('ajouter_transaction', 'POST', donnees);
    notifier('Opération ajoutée');
    e.target.reset();
    el.date_operation.value = new Date().toISOString().slice(0, 10);
    rafraichirOptionsCategorie();
    await toutRafraichir();
    if (donnees.type === 'depense') {
      await proposerArrondi(donnees.montant);
    }
  } catch (err) {
    notifier(err.message);
  }
});

// ---------- Arrondis d'entraînement ----------
async function proposerArrondi(montant) {
  const arrondiA = Math.ceil(montant / 5) * 5;
  const ecart = Math.round((arrondiA - montant) * 100) / 100;
  if (ecart <= 0) return;

  const objectifs = await api('objectifs');
  if (!objectifs.length) return;

  arrondi_en_attente = ecart;
  el.select_objectif_arrondi.innerHTML = '';
  for (const o of objectifs) {
    const option = document.createElement('option');
    option.value = o.id;
    option.textContent = o.nom;
    el.select_objectif_arrondi.appendChild(option);
  }
  el.texte_arrondi.textContent =
    `Cette dépense arrondie à ${fmtEuro(arrondiA)} laisse ${fmtEuro(ecart)} d'écart. Transforme-le en épargne en un clic :`;
  el.carte_arrondi.hidden = false;
}

el.bouton_envoyer_arrondi.addEventListener('click', async () => {
  try {
    await api('contribuer_objectif', 'POST', { id: el.select_objectif_arrondi.value, montant: arrondi_en_attente });
    notifier(`+${fmtEuro(arrondi_en_attente)} envoyés vers ton objectif`);
    el.carte_arrondi.hidden = true;
    await toutRafraichir();
  } catch (err) {
    notifier(err.message);
  }
});

el.bouton_ignorer_arrondi.addEventListener('click', () => {
  el.carte_arrondi.hidden = true;
});

// ---------- Objectifs ----------
async function chargerObjectifs() {
  const objectifs = await api('objectifs');
  el.liste_objectifs.innerHTML = '';

  for (const objectif of objectifs) {
    const pct = objectif.montant_cible > 0 ? Math.min(100, (objectif.montant_actuel / objectif.montant_cible) * 100) : 0;
    const cleIcone = objectif.icone || CLES_ICONE_OBJECTIF[objectif.categorie] || 'cible';
    const li = document.createElement('li');
    li.innerHTML = `
      <article class="goal-card">
        <h4>${ICONES[cleIcone] || ICONES.cible} ${objectif.nom}</h4>
        <p class="goal-meta">${objectif.echeance ? 'Échéance : ' + new Date(objectif.echeance).toLocaleDateString('fr-FR') : 'Sans échéance fixe'}</p>
        <div class="track-lane">
          <div class="track-fill" style="width:${pct}%"></div>
          <span class="track-marker" style="left:${pct}%"></span>
        </div>
        <p class="goal-progress-text">${fmtEuro(objectif.montant_actuel)} / ${fmtEuro(objectif.montant_cible)} (${pct.toFixed(1)}%)</p>
        <div class="goal-actions">
          <label for="contrib-${objectif.id}" class="sr-only">Montant à verser pour ${objectif.nom}</label>
          <input type="number" min="1" step="1" placeholder="Montant €" id="contrib-${objectif.id}" data-contrib="${objectif.id}">
          <button class="btn primary small" data-ajout="${objectif.id}">Verser</button>
        </div>
      </article>`;
    el.liste_objectifs.appendChild(li);
  }

  el.liste_objectifs.querySelectorAll('[data-ajout]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      const idObjectif = bouton.getAttribute('data-ajout');
      const champ = el.liste_objectifs.querySelector(`[data-contrib="${idObjectif}"]`);
      const montant = parseFloat(champ.value);
      if (!montant || montant <= 0) { notifier('Indique un montant valide'); return; }
      try {
        await api('contribuer_objectif', 'POST', { id: idObjectif, montant: montant });
        notifier('Versement enregistré');
        champ.value = '';
        await toutRafraichir();
      } catch (err) {
        notifier(err.message);
      }
    });
  });
}

el.bouton_nouvel_objectif.addEventListener('click', () => {
  el.formulaire_objectif.hidden = !el.formulaire_objectif.hidden;
});

el.formulaire_objectif.addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = {
    nom: el.nom_objectif.value.trim(),
    categorie: el.categorie_objectif.value,
    montant_cible: parseFloat(el.cible_objectif.value),
    echeance: el.echeance_objectif.value || null,
    icone: CLES_ICONE_OBJECTIF[el.categorie_objectif.value] || 'cible',
  };
  try {
    await api('ajouter_objectif', 'POST', donnees);
    notifier('Objectif créé');
    e.target.reset();
    e.target.hidden = true;
    await chargerObjectifs();
  } catch (err) {
    notifier(err.message);
  }
});

// ---------- Défis ----------
async function chargerDefis() {
  const defis = await api('defis');
  el.liste_defis.innerHTML = '';

  for (const defi of defis) {
    const termine = defi.statut === 'termine';
    let points = '';
    for (let i = 0; i < defi.jours_cible; i++) {
      points += `<span class="streak-dot ${i < defi.jours_valides ? 'filled' : ''}"></span>`;
    }

    const li = document.createElement('li');
    li.innerHTML = `
      <article class="challenge-card">
        <span class="challenge-status ${termine ? 'termine' : ''}">${termine ? 'Défi terminé' : `${defi.jours_valides}/${defi.jours_cible}`}</span>
        <h4>${termine ? ICONES.trophee : ICONES.flamme} ${defi.titre}</h4>
        <p class="challenge-desc">${defi.description || ''}</p>
        <div class="streak-dots">${points}</div>
        <button class="btn primary small" data-validation="${defi.id}" ${termine ? 'disabled' : ''}>
          ${termine ? 'Bravo, objectif validé !' : 'Valider aujourd\'hui'}
        </button>
      </article>`;
    el.liste_defis.appendChild(li);
  }

  el.liste_defis.querySelectorAll('[data-validation]').forEach((bouton) => {
    bouton.addEventListener('click', async () => {
      try {
        const res = await api('valider_defi', 'POST', { id: bouton.getAttribute('data-validation') });
        notifier(res.defi.statut === 'termine' ? 'Défi terminé, bravo !' : 'Jour validé');
        await toutRafraichir();
      } catch (err) {
        notifier(err.message);
      }
    });
  });
}

el.bouton_nouveau_defi.addEventListener('click', () => {
  el.formulaire_defi.hidden = !el.formulaire_defi.hidden;
});

el.formulaire_defi.addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = {
    titre: el.titre_defi.value.trim(),
    description: el.description_defi.value.trim(),
    jours_cible: parseInt(el.jours_cible_defi.value, 10),
  };
  try {
    await api('ajouter_defi', 'POST', donnees);
    notifier('Défi créé');
    e.target.reset();
    e.target.hidden = true;
    await chargerDefis();
  } catch (err) {
    notifier(err.message);
  }
});

// ---------- Déconnexion ----------
el.bouton_deconnexion.addEventListener('click', async () => {
  await fetch('serveur/deconnexion.php', { method: 'POST' });
  window.location.href = 'index.html';
});

// ---------- Initialisation ----------
async function toutRafraichir() {
  await chargerTableauBord();
  await chargerTransactions();
  await chargerObjectifs();
  await chargerDefis();
  await chargerPerformance();
}

el.selecteur_mois.addEventListener('change', async (e) => {
  mois_courant = e.target.value;
  await toutRafraichir();
});

el.selecteur_mois.value = mois_courant;
el.date_operation.value = new Date().toISOString().slice(0, 10);
rafraichirOptionsCategorie();
toutRafraichir();
