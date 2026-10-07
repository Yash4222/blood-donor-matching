const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

const toQuery = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && q.append(k, v));
  return q.toString();
};

export const getDonors = (filters = {}) => request('/donors?' + toQuery(filters));
export const createDonor = (body) => request('/donors', { method: 'POST', body: JSON.stringify(body) });
export const updateDonor = (id, body) => request('/donors/' + id, { method: 'PUT', body: JSON.stringify(body) });
export const deleteDonor = (id) => request('/donors/' + id, { method: 'DELETE' });

export const getRequests = () => request('/requests');
export const createRequest = (body) => request('/requests', { method: 'POST', body: JSON.stringify(body) });
export const updateRequest = (id, body) => request('/requests/' + id, { method: 'PUT', body: JSON.stringify(body) });
export const deleteRequest = (id) => request('/requests/' + id, { method: 'DELETE' });
export const getMatches = (id) => request('/requests/' + id + '/matches');