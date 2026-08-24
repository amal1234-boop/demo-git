const formulaire = document.getElementById('formulaire_inscription');
const boiteErreur = document.getElementById('erreur_formulaire');

formulaire.addEventListener('submit', async (e) => {
  e.preventDefault();
  boiteErreur.hidden = true;

  const mot_de_passe = document.getElementById('mot_de_passe').value;
  const confirmation_mot_de_passe = document.getElementById('confirmation_mot_de_passe').value;
  if (mot_de_passe !== confirmation_mot_de_passe) {
    boiteErreur.textContent = 'Les mots de passe ne correspondent pas.';
    boiteErreur.hidden = false;
    return;
  }

  const donnees = {
    nom: document.getElementById('nom').value.trim(),
    email: document.getElementById('email').value.trim(),
    mot_de_passe,
  };

  try {
    const res = await fetch('serveur/inscription.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.erreur || 'Inscription impossible pour le moment.');
    window.location.href = 'app.php';
  } catch (err) {
    boiteErreur.textContent = err.message;
    boiteErreur.hidden = false;
  }
});
