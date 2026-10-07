import { useState, useEffect } from 'react';
import * as api from './api';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function App() {
  const [tab, setTab] = useState('find');
  const tabs = [['find', 'Find Donors'], ['register', 'Become a Donor'], ['requests', 'Blood Requests']];
  return (
    <div className="container">
      <h1>🩸 Blood Request &amp; Donor Matching</h1>
      <nav>
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'tab active' : 'tab'} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'find' && <FindDonors />}
      {tab === 'register' && <RegisterDonor onDone={() => setTab('find')} />}
      {tab === 'requests' && <Requests />}
    </div>
  );
}

function FindDonors() {
  const [filters, setFilters] = useState({ bloodGroup: '', city: '' });
  const [donors, setDonors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try { setDonors(await api.getDonors(filters)); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (d) => {
    try { await api.updateDonor(d._id, { available: !d.available }); load(); }
    catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this donor?')) return;
    try { await api.deleteDonor(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="card row">
        <select value={filters.bloodGroup} onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}>
          <option value="">All blood groups</option>
          {GROUPS.map((g) => <option key={g}>{g}</option>)}
        </select>
        <input placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
        <button onClick={load}>Search</button>
      </div>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading... (the first load can take up to a minute)</p>}
      {!loading && donors.length === 0 && <p>No donors found.</p>}
      <div className="grid">
        {donors.map((d) => (
          <div className="card" key={d._id}>
            <span className="badge">{d.bloodGroup}</span>
            <h3>{d.name}</h3>
            <p>📍 {d.city} &nbsp; 🎂 {d.age} yrs</p>
            <p>📞 {d.phone}</p>
            <p className={d.available ? 'ok' : 'no'}>{d.available ? 'Available' : 'Not available'}</p>
            <button onClick={() => toggle(d)}>{d.available ? 'Mark unavailable' : 'Mark available'}</button>{' '}
            <button className="danger" onClick={() => remove(d._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterDonor({ onDone }) {
  const [form, setForm] = useState({ name: '', bloodGroup: '', city: '', phone: '', age: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.bloodGroup || !form.city.trim()) return setError('Please fill all fields');
    if (!/^\d{10}$/.test(form.phone)) return setError('Phone must be 10 digits');
    if (form.age < 18 || form.age > 65) return setError('Age must be between 18 and 65');
    try {
      await api.createDonor(form);
      alert('Donor registered!');
      onDone();
    } catch (err) { setError(err.message); }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Register as a Donor</h2>
      <input placeholder="Full name" value={form.name} onChange={set('name')} />
      <select value={form.bloodGroup} onChange={set('bloodGroup')}>
        <option value="">Select blood group</option>
        {GROUPS.map((g) => <option key={g}>{g}</option>)}
      </select>
      <input placeholder="City" value={form.city} onChange={set('city')} />
      <input placeholder="Phone (10 digits)" value={form.phone} onChange={set('phone')} />
      <input type="number" placeholder="Age" value={form.age} onChange={set('age')} />
      {error && <p className="error">{error}</p>}
      <button type="submit">Register</button>
    </form>
  );
}

function Requests() {
  const empty = { patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Normal' };
  const [form, setForm] = useState(empty);
  const [list, setList] = useState([]);
  const [matches, setMatches] = useState({});
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = async () => {
    try { setList(await api.getRequests()); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.patientName.trim() || !form.bloodGroup || !form.hospital.trim() || !form.city.trim())
      return setError('Please fill all fields');
    if (form.units < 1 || form.units > 10) return setError('Units must be between 1 and 10');
    if (!/^\d{10}$/.test(form.contact)) return setError('Contact must be 10 digits');
    try {
      await api.createRequest(form);
      setForm(empty);
      load();
    } catch (err) { setError(err.message); }
  };

  const findMatches = async (id) => {
    try { setMatches({ ...matches, [id]: await api.getMatches(id) }); }
    catch (e) { setError(e.message); }
  };
  const fulfil = async (id) => {
    try { await api.updateRequest(id, { status: 'Fulfilled' }); load(); }
    catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    if (!confirm('Delete this request?')) return;
    try { await api.deleteRequest(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div>
      <form className="card form" onSubmit={submit}>
        <h2>Post a Blood Request</h2>
        <input placeholder="Patient name" value={form.patientName} onChange={set('patientName')} />
        <select value={form.bloodGroup} onChange={set('bloodGroup')}>
          <option value="">Blood group needed</option>
          {GROUPS.map((g) => <option key={g}>{g}</option>)}
        </select>
        <input type="number" placeholder="Units needed (1-10)" value={form.units} onChange={set('units')} />
        <input placeholder="Hospital" value={form.hospital} onChange={set('hospital')} />
        <input placeholder="City" value={form.city} onChange={set('city')} />
        <input placeholder="Contact number (10 digits)" value={form.contact} onChange={set('contact')} />
        <select value={form.urgency} onChange={set('urgency')}>
          <option>Normal</option><option>Urgent</option><option>Critical</option>
        </select>
        {error && <p className="error">{error}</p>}
        <button type="submit">Post Request</button>
      </form>

      <div className="grid">
        {list.map((r) => (
          <div className="card" key={r._id}>
            <span className="badge">{r.bloodGroup}</span>
            <h3>{r.patientName} · {r.units} unit(s)</h3>
            <p>🏥 {r.hospital}, {r.city}</p>
            <p>📞 {r.contact}</p>
            <p>Urgency: <b>{r.urgency}</b> · <span className={r.status === 'Open' ? 'no' : 'ok'}>{r.status}</span></p>
            <button onClick={() => findMatches(r._id)}>Find matching donors</button>{' '}
            {r.status === 'Open' && <button onClick={() => fulfil(r._id)}>Mark fulfilled</button>}{' '}
            <button className="danger" onClick={() => remove(r._id)}>Delete</button>
            {matches[r._id] && (
              <div className="matches">
                {matches[r._id].length === 0 && <p>No matching donors in this city yet.</p>}
                {matches[r._id].map((d) => (
                  <p key={d._id}>✅ {d.name} ({d.bloodGroup}) – {d.phone}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}