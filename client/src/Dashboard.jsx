import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import LeadPanel from './LeadPanel.jsx';
import { fmtDate, isOverdue } from './utils.js';

const STATUSES = ['new', 'contacted', 'converted'];

export default function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ leads: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ search, status, page });
      const [s, l] = await Promise.all([api('/leads/stats'), api(`/leads?${qs}`)]);
      setStats(s); setData(l); setError('');
    } catch (e) { setError(e.message); }
  }, [search, status, page]);

  // Wait 300ms after typing stops so we don't call the API on every keystroke.
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const selected = data.leads.find((l) => l._id === selectedId);

  return (
    <div className="shell">
      <header>
        <h1>Leadbook</h1>
        <div>
          <button className="primary" onClick={() => setAdding(true)}>Add lead</button>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      {stats && (
        <section className="summary" aria-label="Summary">
          <div className="pipeline" role="img" aria-label={`${stats.new} new, ${stats.contacted} contacted, ${stats.converted} converted`}>
            {STATUSES.map((s) => stats[s] > 0 && <span key={s} className={`seg ${s}`} style={{ flex: stats[s] }} />)}
          </div>
          <dl>
            <div><dt>Total leads</dt><dd>{stats.total}</dd></div>
            <div><dt>New</dt><dd>{stats.new}</dd></div>
            <div><dt>Contacted</dt><dd>{stats.contacted}</dd></div>
            <div><dt>Converted</dt><dd>{stats.converted}</dd></div>
            <div><dt>Conversion rate</dt><dd>{stats.conversionRate}%</dd></div>
            <div className={stats.dueFollowUps ? 'alert' : ''}><dt>Follow-ups due</dt><dd>{stats.dueFollowUps}</dd></div>
          </dl>
        </section>
      )}

      <div className="toolbar">
        <input type="search" placeholder="Search by name, email or source" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search leads" />
        <div className="tabs" role="group" aria-label="Filter by status">
          {['', ...STATUSES].map((s) => (
            <button key={s} className={status === s ? 'on' : ''} onClick={() => { setStatus(s); setPage(1); }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Source</th><th>Status</th><th>Follow-up</th><th>Received</th></tr></thead>
          <tbody>
            {data.leads.map((l) => (
              <tr key={l._id} className={l._id === selectedId ? 'sel' : ''} onClick={() => setSelectedId(l._id)}
                  tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelectedId(l._id)}>
                <td><strong>{l.name}</strong></td>
                <td>{l.email}</td>
                <td>{l.source}</td>
                <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                <td className={isOverdue(l) ? 'overdue' : ''}>{fmtDate(l.followUpDate)}{isOverdue(l) && ' (due)'}</td>
                <td>{fmtDate(l.createdAt)}</td>
              </tr>
            ))}
            {!data.leads.length && (
              <tr><td colSpan="6" className="empty">
                {search || status ? 'No leads match these filters.' : 'No leads yet. Share the contact form or use Add lead to enter one.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="pager">
        <span className="muted">{data.total} lead{data.total === 1 ? '' : 's'}</span>
        <div>
          <button className="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span> Page {page} of {data.pages} </span>
          <button className="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </footer>

      {selected && <LeadPanel lead={selected} onClose={() => setSelectedId(null)} onChanged={load} />}
      {adding && <AddLead onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function AddLead({ onClose, onSaved }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', source: '', message: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    try { await api('/leads', { method: 'POST', body: f }); onSaved(); } catch (err) { setError(err.message); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h2>Add lead</h2>
        <label>Name<input required autoFocus value={f.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Phone<input value={f.phone} onChange={set('phone')} /></label>
        <label>Source<input placeholder="Referral, Instagram, phone call…" value={f.source} onChange={set('source')} /></label>
        <label>What they asked for<textarea rows="3" value={f.message} onChange={set('message')} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row"><button type="button" className="ghost" onClick={onClose}>Cancel</button><button className="primary">Save lead</button></div>
      </form>
    </div>
  );
}
