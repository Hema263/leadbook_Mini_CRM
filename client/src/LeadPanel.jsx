import { useState } from 'react';
import { api } from './api.js';
import { fmtDate } from './utils.js';

const STATUSES = ['new', 'contacted', 'converted'];

export default function LeadPanel({ lead, onClose, onChanged }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Every action calls the API, then asks the dashboard to reload so the UI matches the database.
  async function run(fn) {
    try { await fn(); setError(''); await onChanged(); } catch (e) { setError(e.message); }
  }
  const patch = (body) => run(() => api(`/leads/${lead._id}`, { method: 'PATCH', body }));
  const addNote = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    run(async () => { await api(`/leads/${lead._id}/notes`, { method: 'POST', body: { text: note } }); setNote(''); });
  };
  const remove = () => {
    if (window.confirm(`Delete ${lead.name}? This cannot be undone.`))
      run(async () => { await api(`/leads/${lead._id}`, { method: 'DELETE' }); onClose(); });
  };

  return (
    <aside className="panel" aria-label={`Lead: ${lead.name}`}>
      <div className="panel-head">
        <div>
          <h2>{lead.name}</h2>
          <a href={`mailto:${lead.email}`}>{lead.email}</a>
          {lead.phone && <div className="muted">{lead.phone}</div>}
        </div>
        <button className="ghost" onClick={onClose}>Close</button>
      </div>

      <p className="muted small">From {lead.source} on {fmtDate(lead.createdAt)}</p>
      {lead.message && <blockquote>{lead.message}</blockquote>}

      <h3>Status</h3>
      <div className="steps">
        {STATUSES.map((s) => (
          <button key={s} className={`${s} ${lead.status === s ? 'on' : ''}`} onClick={() => patch({ status: s })}>{s}</button>
        ))}
      </div>

      <h3>Next follow-up</h3>
      <div className="row">
        <input type="date" value={lead.followUpDate ? lead.followUpDate.slice(0, 10) : ''}
          onChange={(e) => patch({ followUpDate: e.target.value || null })} />
        {lead.followUpDate && <button className="ghost" onClick={() => patch({ followUpDate: null })}>Clear</button>}
      </div>

      <h3>Notes</h3>
      <form onSubmit={addNote}>
        <textarea rows="3" placeholder="What happened? What is the next step?" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="primary" disabled={!note.trim()}>Add note</button>
      </form>
      <ul className="notes">
        {lead.notes.map((n) => (
          <li key={n._id}><p>{n.text}</p><span className="muted small">{new Date(n.createdAt).toLocaleString()}</span></li>
        ))}
        {!lead.notes.length && <li className="muted">No notes yet.</li>}
      </ul>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="danger" onClick={remove}>Delete lead</button>
    </aside>
  );
}
