import { useState } from 'react';
import { api, setToken } from './api.js';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: form });
      setToken(token);
      onLogin();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <h1>Leadbook</h1>
        <p className="muted">Sign in to see who has been asking about your work.</p>
        <label>Email
          <input type="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>Password
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
