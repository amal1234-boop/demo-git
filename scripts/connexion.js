const form = document.getElementById('loginForm');
const errorBox = document.getElementById('formError');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const payload = {
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
  };

  try {
    const res = await fetch('serveur/connexion.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Connexion impossible pour le moment.');
    window.location.href = 'app.php';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
