const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the API and MongoDB are running.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'The request could not be completed.');
  return payload;
}

const queryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== 'All') query.set(key, value);
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
};

export const api = {
  donors: (filters = {}) => request(`/donors${queryString(filters)}`),
  createDonor: (data) => request('/donors', { method: 'POST', body: JSON.stringify(data) }),
  updateDonor: (id, data) => request(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDonor: (id) => request(`/donors/${id}`, { method: 'DELETE' }),
  requests: (filters = {}) => request(`/requests${queryString(filters)}`),
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (id, data) => request(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  patchRequest: (id, data) => request(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRequest: (id) => request(`/requests/${id}`, { method: 'DELETE' })
};
