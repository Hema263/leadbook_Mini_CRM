export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// A follow-up is overdue when its date has passed and the lead is not yet converted.
export const isOverdue = (l) => l.followUpDate && l.status !== 'converted' && new Date(l.followUpDate) <= new Date();
