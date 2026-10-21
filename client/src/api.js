// One small wrapper so every request carries the admin token and handles errors the same way.
export const getToken = () => localStorage.getItem('crm_token');
export const setToken = (t) => (t ? localStorage.setItem('crm_token', t) : localStorage.removeItem('crm_token'));

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  // Expired or invalid token: clear it and return to the login screen.
  if (res.status === 401 && path !== '/auth/login') { setToken(null); window.location.reload(); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
