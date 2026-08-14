const form = document.getElementById('registerForm');
const errorBox = document.getElementById('formError');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  if (password !== passwordConfirm) {
    errorBox.textContent = 'Les mots de passe ne correspondent pas.';
    errorBox.hidden = false;
    return;
  }

  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    password,
  };

  try {
    const res = await fetch('serveur/inscription.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Inscription impossible pour le moment.');
    window.location.href = 'app.php';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
});
