const formulaire = document.getElementById('formulaire_connexion');
const boiteErreur = document.getElementById('erreur_formulaire');

formulaire.addEventListener('submit', async (e) => {
  e.preventDefault();
  boiteErreur.hidden = true;

  const donnees = {
    email: document.getElementById('email').value.trim(),
    mot_de_passe: document.getElementById('mot_de_passe').value,
  };

  try {
    const res = await fetch('serveur/connexion.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.erreur || 'Connexion impossible pour le moment.');
    window.location.href = 'app.php';
  } catch (err) {
    boiteErreur.textContent = err.message;
    boiteErreur.hidden = false;
  }
});
