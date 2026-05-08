function initLogin() {
  document.getElementById('login-form').onsubmit = handleLoginSubmit;
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const data = await Api.login(email, password);
    Api.setToken(data.accessToken);
    location.hash = '#products';
  } catch (err) {
    errorEl.textContent = err.message || 'Login failed.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
}

function initRegister() {
  document.getElementById('register-form').onsubmit = handleRegisterSubmit;
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById('reg-error');
  errorEl.textContent = '';

  const name      = document.getElementById('reg-name').value.trim();
  const surname   = document.getElementById('reg-surname').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;

  if (!name || !surname || !email || !password || !password2) {
    errorEl.textContent = 'Please fill in all fields.';
    return;
  }

  if (password.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters.';
    return;
  }

  if (password !== password2) {
    errorEl.textContent = 'Passwords do not match.';
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Registering…';

  try {
    await Api.register(name, surname, email, password);
    sessionStorage.setItem('pendingEmail', email);
    location.hash = '#verify-otp';
  } catch (err) {
    errorEl.textContent = err.message || 'Registration failed.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register';
  }
}

function initVerifyOtp() {
  document.getElementById('otp-form').onsubmit = handleOtpSubmit;
}

async function handleOtpSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById('otp-error');
  errorEl.textContent = '';

  const email = sessionStorage.getItem('pendingEmail');
  const otp   = document.getElementById('otp-code').value.trim();

  if (!email) {
    errorEl.textContent = 'Sessione scaduta. Ripeti la registrazione.';
    return;
  }
  if (!otp || otp.length !== 6) {
    errorEl.textContent = 'Inserisci un codice a 6 cifre.';
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Verifica in corso…';

  try {
    await Api.verifyOtp(email, otp);
    sessionStorage.removeItem('pendingEmail');
    location.hash = '#login';
  } catch (err) {
    errorEl.textContent = err.message || 'Codice non valido.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verifica';
  }
}
