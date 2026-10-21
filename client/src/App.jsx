import { useState } from 'react';
import { getToken, setToken } from './api.js';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const logout = () => { setToken(null); setAuthed(false); };
  return authed ? <Dashboard onLogout={logout} /> : <Login onLogin={() => setAuthed(true)} />;
}
