import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronDown, Clock3, Droplet, Heart, HeartHandshake, MapPin,
  Menu, Pencil, Phone, Plus, Search, ShieldCheck, Sparkles, Trash2, Users, X
} from 'lucide-react';
import { api } from './api';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const emptyDate = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const prettyDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided';
const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function App() {
  const [page, setPage] = useState('Overview');
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [filters, setFilters] = useState({ bloodGroup: 'All', location: '', available: 'true' });
  const [appliedFilters, setAppliedFilters] = useState({ bloodGroup: 'All', location: '', available: 'true' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [donorData, requestData] = await Promise.all([api.donors(), api.requests()]);
      setDonors(donorData);
      setRequests(requestData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleDonors = useMemo(() => {
    const location = appliedFilters.location.trim().toLowerCase();
    return donors.filter((donor) => {
      const groupMatch = appliedFilters.bloodGroup === 'All' || donor.bloodGroup === appliedFilters.bloodGroup;
      const place = `${donor.city} ${donor.state || ''}`.toLowerCase();
      return groupMatch && (!location || place.includes(location)) && (appliedFilters.available !== 'true' || donor.available);
    });
  }, [donors, appliedFilters]);
  const openRequests = useMemo(() => requests.filter((item) => item.status !== 'Fulfilled'), [requests]);

  const goTo = (destination) => {
    setPage(destination);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitModal = async (event) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      if (modal.type === 'donor') {
        data.age = Number(data.age);
        data.available = data.available === 'true';
        data.lastDonation = data.lastDonation || null;
        if (modal.item?._id) await api.updateDonor(modal.item._id, data);
        else await api.createDonor(data);
        setNotice(modal.item ? 'Donor profile updated.' : 'You’re now registered as a donor. Thank you!');
      } else {
        data.units = Number(data.units);
        if (modal.item?._id) await api.updateRequest(modal.item._id, data);
        else await api.createRequest(data);
        setNotice(modal.item ? 'Blood request updated.' : 'Your blood request has been posted.');
      }
      setModal(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeDonor = async (donor) => {
    if (!window.confirm(`Delete ${donor.name}’s donor profile?`)) return;
    try { await api.deleteDonor(donor._id); setNotice('Donor profile removed.'); await loadData(); }
    catch (err) { setError(err.message); }
  };
  const removeRequest = async (item) => {
    if (!window.confirm('Delete this blood request?')) return;
    try { await api.deleteRequest(item._id); setNotice('Blood request deleted.'); await loadData(); }
    catch (err) { setError(err.message); }
  };
  const updateStatus = async (item, status) => {
    try { await api.patchRequest(item._id, { status }); setNotice(`Request marked ${status.toLowerCase()}.`); await loadData(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); goTo('Overview'); }}>
          <span className="brand-mark"><Droplet size={22} fill="currentColor" /></span>
          <span>bloodline<span className="brand-dot">.</span><small>COMMUNITY DONOR NETWORK</small></span>
        </a>
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={21} /></button>
        <nav className={`main-nav ${mobileNav ? 'nav-open' : ''}`} aria-label="Main navigation">
          {['Overview', 'Find donors', 'Blood requests'].map((item) => (
            <button key={item} className={`nav-link ${page === item ? 'active' : ''}`} onClick={() => goTo(item)}>{item}</button>
          ))}
        </nav>
        <div className="header-actions">
          <span className="secure-label"><ShieldCheck size={15} /> Verified community</span>
          <button className="button button-primary button-small" onClick={() => setModal({ type: 'request' })}><Plus size={16} /> Request blood</button>
        </div>
      </header>

      <main>
        {(error || notice) && <div className={`toast ${error ? 'toast-error' : ''}`} role="status"><span>{error || notice}</span><button onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss"><X size={16} /></button></div>}
        {page === 'Overview' && <Overview donors={donors} requests={openRequests} loading={loading} onNavigate={goTo} onAction={setModal} onFind={(value) => { setFilters((prev) => ({ ...prev, ...value })); setAppliedFilters((prev) => ({ ...prev, ...value })); goTo('Find donors'); }} />}
        {page === 'Find donors' && <DonorsPage donors={visibleDonors} loading={loading} filters={filters} setFilters={setFilters} onSearch={() => setAppliedFilters(filters)} onReset={() => { const reset = { bloodGroup: 'All', location: '', available: 'true' }; setFilters(reset); setAppliedFilters(reset); }} onAdd={() => setModal({ type: 'donor' })} onEdit={(item) => setModal({ type: 'donor', item })} onDelete={removeDonor} />}
        {page === 'Blood requests' && <RequestsPage requests={requests} loading={loading} onAdd={() => setModal({ type: 'request' })} onEdit={(item) => setModal({ type: 'request', item })} onDelete={removeRequest} onStatus={updateStatus} onFind={() => goTo('Find donors')} />}
      </main>

      <footer className="footer"><a className="footer-brand" href="#home" onClick={(e) => { e.preventDefault(); goTo('Overview'); }}><Droplet size={16} fill="currentColor" /> bloodline<span>.</span></a><span>One donation can save up to three lives.</span><span className="footer-note"><ShieldCheck size={14} /> Your community. Your impact.</span></footer>
      {modal && <Modal modal={modal} onClose={() => setModal(null)} onSubmit={submitModal} saving={saving} />}
    </div>
  );
}

function Overview({ donors, requests, loading, onNavigate, onAction, onFind }) {
  const available = donors.filter((donor) => donor.available).length;
  const totalUnits = requests.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const [search, setSearch] = useState({ bloodGroup: 'All', location: '' });
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> EVERY DROP MAKES A DIFFERENCE</div>
          <h1>When every moment<br />matters, <em>we’re here.</em></h1>
          <p>Connecting people who need blood with generous donors nearby. Because showing up for each other saves lives.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={() => onAction({ type: 'donor' })}><Heart size={17} /> Become a donor <ArrowRight size={16} /></button><button className="button button-light" onClick={() => onNavigate('Blood requests')}>View blood requests <ArrowRight size={16} /></button></div>
          <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><span><strong>Everyday heroes</strong><br />making a real difference</span><div className="proof-stars">★★★★★</div></div>
        </div>
        <div className="hero-art" aria-label="Illustration of a blood drop">
          <div className="art-glow" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="blood-drop"><HeartHandshake size={74} strokeWidth={1.2} /></div>
          <div className="floating-card float-top"><span className="float-icon"><Activity size={17} /></span><span><strong>Right place,</strong><br />right time</span><CheckCircle2 size={18} className="float-check" /></div>
          <div className="floating-card float-bottom"><span className="mini-drop"><Droplet size={17} fill="currentColor" /></span><span><strong>One donation</strong><br />can save 3 lives</span></div>
          <span className="sparkle sparkle-a">✳</span><span className="sparkle sparkle-b">✦</span>
        </div>
        <div className="search-panel">
          <div className="search-intro"><span className="search-icon"><Search size={19} /></span><span><strong>Find a donor near you</strong><small>Search our local donor community</small></span></div>
          <label className="search-field"><span>Blood group</span><span className="select-wrap"><select value={search.bloodGroup} onChange={(e) => setSearch({ ...search, bloodGroup: e.target.value })}><option value="All">Any blood group</option>{GROUPS.map((group) => <option key={group}>{group}</option>)}</select><ChevronDown size={15} /></span></label>
          <label className="search-field location-field"><span>Location</span><span className="input-with-icon"><MapPin size={16} /><input value={search.location} onChange={(e) => setSearch({ ...search, location: e.target.value })} placeholder="City or ZIP code" onKeyDown={(e) => e.key === 'Enter' && onFind(search)} /></span></label>
          <button className="button button-primary search-submit" onClick={() => onFind(search)}>Find donors <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="stats-strip">
        <div className="section-kicker">OUR COMMUNITY AT A GLANCE</div>
        <div className="stats-grid">
          <Stat icon={<Users size={19} />} value={loading ? '—' : donors.length.toLocaleString()} label="Registered donors" trend="Growing together" />
          <Stat icon={<HeartHandshake size={20} />} value={loading ? '—' : available.toLocaleString()} label="Ready to help" trend="Available donors" />
          <Stat icon={<Droplet size={18} />} value={loading ? '—' : openRequests.length.toLocaleString()} label="Active requests" trend={totalUnits ? `${totalUnits} units needed` : 'Help needed now'} />
          <div className="impact-stat"><span className="impact-icon"><Sparkles size={18} /></span><span className="impact-copy"><strong>Be someone’s</strong><br /><em>reason to hope.</em></span><button className="impact-link" onClick={() => onAction({ type: 'donor' })}>Join our donors <ArrowUpRight size={15} /></button></div>
        </div>
      </section>

      <section className="below-grid">
        <div className="content-panel urgent-panel">
          <div className="panel-heading"><div><div className="section-kicker">THE COMMUNITY NEEDS YOU</div><h2>Requests near you</h2></div><button className="text-link" onClick={() => onNavigate('Blood requests')}>See all requests <ArrowRight size={15} /></button></div>
          {loading ? <LoadingRows /> : requests.length === 0 ? <EmptyState icon={<CheckCircle2 />} title="No open requests right now" body="When someone needs blood, their request will show up here." action="Post a request" onClick={() => onAction({ type: 'request' })} /> : <div className="request-preview-list">{requests.slice(0, 3).map((item) => <RequestRow key={item._id} item={item} onClick={() => onNavigate('Blood requests')} />)}</div>}
        </div>
        <aside className="donate-card"><div className="donate-scribble">✳</div><div className="section-kicker">A LITTLE OF YOU, A LOT FOR SOMEONE</div><h2>Give blood.<br /><em>Give life.</em></h2><p>It takes less than an hour to donate. The impact can last a lifetime.</p><button className="button button-white" onClick={() => onAction({ type: 'donor' })}>Register as a donor <ArrowRight size={16} /></button><span className="donate-note"><ShieldCheck size={14} /> Free, safe &amp; always appreciated</span></aside>
      </section>
      <section className="how-section"><div className="section-kicker">SIMPLE. HUMAN. LIFE-CHANGING.</div><h2>Help is closer than you think.</h2><div className="steps-grid"><Step number="01" title="Share what’s needed" text="Post a blood request or tell us the type you can donate." icon={<Bell size={18} />} /><Step number="02" title="Find your match" text="We connect requests with available donors in the area." icon={<Search size={18} />} /><Step number="03" title="Change a life" text="Reach out directly and make a difference together." icon={<Heart size={18} />} /></div></section>
    </>
  );
}

function Stat({ icon, value, label, trend }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-value">{value}</span><span className="stat-label">{label}</span><span className="stat-trend"><ArrowDownRight size={13} /> {trend}</span></div>;
}

function DonorsPage({ donors, loading, filters, setFilters, onSearch, onReset, onAdd, onEdit, onDelete }) {
  return <section className="page-section"><div className="page-heading"><div><div className="eyebrow"><span className="pulse-dot" /> DONOR DIRECTORY</div><h1>Find your <em>match.</em></h1><p>Search generous people ready to help in your community.</p></div><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Register as a donor</button></div>
    <div className="filter-bar"><label><span>Blood group</span><select value={filters.bloodGroup} onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}><option value="All">All blood groups</option>{GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label><label className="filter-location"><span>City or state</span><input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="e.g. Portland" onKeyDown={(e) => e.key === 'Enter' && onSearch()} /></label><label className="availability-check"><input type="checkbox" checked={filters.available === 'true'} onChange={(e) => setFilters({ ...filters, available: e.target.checked ? 'true' : 'false' })} /><span>Available now</span></label><button className="button button-primary filter-submit" onClick={onSearch}><Search size={16} /> Search donors</button><button className="button button-quiet" onClick={onReset}>Reset</button></div>
    <div className="results-heading"><div><h2>Donors in the community</h2><span>{loading ? 'Loading…' : `${donors.length} ${donors.length === 1 ? 'donor' : 'donors'} found`}</span></div><span className="verified-note"><ShieldCheck size={15} /> Community registered</span></div>
    {loading ? <div className="donor-grid"><div className="loading-card" /><div className="loading-card" /><div className="loading-card" /></div> : donors.length === 0 ? <EmptyState icon={<Users />} title="No donors found just yet" body="Try a different blood group or location, or register as a donor to be the first." action="Become a donor" onClick={onAdd} /> : <div className="donor-grid">{donors.map((donor) => <DonorCard key={donor._id} donor={donor} onEdit={() => onEdit(donor)} onDelete={() => onDelete(donor)} />)}</div>}
    <div className="privacy-note"><ShieldCheck size={18} /><span><strong>People-first, always.</strong> Donor contact details are shared to help coordinate a donation. Please use them respectfully.</span></div>
  </section>;
}

function DonorCard({ donor, onEdit, onDelete }) {
  return <article className="donor-card"><div className="donor-card-top"><div className="donor-avatar">{initials(donor.name)}</div><span className={`availability-pill ${donor.available ? '' : 'not-available'}`}><span />{donor.available ? 'Available' : 'Unavailable'}</span><div className="card-menu"><button className="icon-button" aria-label="Edit donor" onClick={onEdit}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label="Delete donor" onClick={onDelete}><Trash2 size={15} /></button></div></div><div className="donor-name-row"><h3>{donor.name}</h3><span className="blood-badge">{donor.bloodGroup}</span></div><div className="donor-location"><MapPin size={15} />{[donor.city, donor.state].filter(Boolean).join(', ')}</div><div className="donor-meta"><span>{donor.age} years old</span><span className="meta-dot" />{donor.lastDonation ? <span>Last donated {prettyDate(donor.lastDonation)}</span> : <span>New to donating</span>}</div><div className="donor-card-bottom"><a href={`tel:${donor.phone}`} className="button button-contact"><Phone size={15} /> Contact donor</a>{donor.email && <a className="email-link" href={`mailto:${donor.email}`} aria-label={`Email ${donor.name}`}>Email</a>}</div></article>;
}

function RequestsPage({ requests, loading, onAdd, onEdit, onDelete, onStatus, onFind }) {
  return <section className="page-section"><div className="page-heading"><div><div className="eyebrow"><span className="pulse-dot" /> HELP IS NEEDED</div><h1>Blood <em>requests.</em></h1><p>Every connection can make the difference. See how you can help.</p></div><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Post a request</button></div>
    <div className="request-callout"><span className="callout-icon"><HeartHandshake size={23} /></span><div><strong>Can you help someone today?</strong><span>Search available donors by blood group and location.</span></div><button className="button button-light" onClick={onFind}>Find donors <ArrowRight size={15} /></button></div>
    <div className="results-heading"><div><h2>Community requests</h2><span>{loading ? 'Loading…' : `${requests.length} total requests`}</span></div><span className="verified-note"><Clock3 size={15} /> Updated as things change</span></div>
    {loading ? <LoadingRows /> : requests.length === 0 ? <EmptyState icon={<CheckCircle2 />} title="No requests posted" body="If someone needs blood, post a request and help connect them with donors." action="Post a request" onClick={onAdd} /> : <div className="request-list-full">{requests.map((item) => <article className="request-card" key={item._id}><div className="request-card-main"><span className="request-blood">{item.bloodGroup}</span><div className="request-description"><div className="request-title-row"><h3>{item.patientName} needs {item.units} {item.units === 1 ? 'unit' : 'units'}</h3><span className={`urgency-badge urgency-${item.urgency.toLowerCase()}`}>{item.urgency}</span></div><p><MapPin size={14} />{item.hospital}, {item.city}{item.state ? `, ${item.state}` : ''}</p><div className="request-details"><span><CalendarDays size={14} /> Needed by {prettyDate(item.neededBy)}</span><span><Phone size={14} /> {item.contactName}: <a href={`tel:${item.contactPhone}`}>{item.contactPhone}</a></span></div>{item.details && <p className="request-extra">{item.details}</p>}</div></div><div className="request-card-actions"><span className={`status-pill status-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span><a className="button button-contact" href={`tel:${item.contactPhone}`}><Phone size={15} /> Contact</a><button className="icon-button" aria-label="Edit request" onClick={() => onEdit(item)}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label="Delete request" onClick={() => onDelete(item)}><Trash2 size={15} /></button><select className="status-select" value={item.status} aria-label="Update request status" onChange={(e) => onStatus(item, e.target.value)}><option>Open</option><option>In progress</option><option>Fulfilled</option></select></div></article>)}</div>}
  </section>;
}

function RequestRow({ item, onClick }) {
  return <button className="request-row" onClick={onClick}><span className="request-blood small-blood">{item.bloodGroup}</span><span className="request-row-copy"><strong>{item.patientName} needs {item.units} {item.units === 1 ? 'unit' : 'units'}</strong><small><MapPin size={13} /> {item.hospital}, {item.city}</small></span><span className={`urgency-badge urgency-${item.urgency.toLowerCase()}`}>{item.urgency}</span><ArrowRight size={16} className="row-arrow" /></button>;
}

function Step({ number, title, text, icon }) { return <article className="step-card"><span className="step-number">{number}</span><span className="step-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article>; }
function LoadingRows() { return <div className="loading-rows"><span /><span /><span /></div>; }
function EmptyState({ icon, title, body, action, onClick }) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{body}</p>{action && <button className="button button-primary button-small" onClick={onClick}>{action} <ArrowRight size={15} /></button>}</div>; }

function Modal({ modal, onClose, onSubmit, saving }) {
  const donor = modal.type === 'donor';
  const item = modal.item || {};
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><span className="modal-icon">{donor ? <Heart size={20} /> : <Droplet size={20} />}</span><div><h2 id="modal-title">{donor ? (item._id ? 'Edit donor profile' : 'Become a donor') : (item._id ? 'Edit blood request' : 'Post a blood request')}</h2><p>{donor ? 'A few details help people find their match.' : 'Share the details so nearby donors can respond.'}</p></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
    <form onSubmit={onSubmit} className="modal-form"><div className="form-grid">
      {donor ? <>
        <Field label="Full name" name="name" required defaultValue={item.name} placeholder="Your name" />
        <Field label="Blood group" name="bloodGroup" required select defaultValue={item.bloodGroup || ''}><option value="" disabled>Select group</option>{GROUPS.map((group) => <option key={group}>{group}</option>)}</Field>
        <Field label="Age" name="age" required type="number" min="18" max="65" defaultValue={item.age} placeholder="18–65" />
        <Field label="Phone number" name="phone" required type="tel" defaultValue={item.phone} placeholder="+1 555 010 2345" />
        <Field label="Email (optional)" name="email" type="email" defaultValue={item.email} placeholder="you@example.com" />
        <Field label="City" name="city" required defaultValue={item.city} placeholder="Your city" />
        <Field label="State / region" name="state" defaultValue={item.state} placeholder="State" />
        <Field label="Last donation" name="lastDonation" type="date" defaultValue={emptyDate(item.lastDonation)} />
        <Field label="Availability" name="available" select defaultValue={item.available === false ? 'false' : 'true'}><option value="true">Available to donate</option><option value="false">Not available right now</option></Field>
        <Field label="A note for requesters (optional)" name="notes" className="field-full" defaultValue={item.notes} placeholder="Anything you'd like donors to know" />
      </> : <>
        <Field label="Patient name" name="patientName" required defaultValue={item.patientName} placeholder="Name of person in need" />
        <Field label="Blood group needed" name="bloodGroup" required select defaultValue={item.bloodGroup || ''}><option value="" disabled>Select group</option>{GROUPS.map((group) => <option key={group}>{group}</option>)}</Field>
        <Field label="Units needed" name="units" required type="number" min="1" max="20" defaultValue={item.units || 1} />
        <Field label="Urgency" name="urgency" select defaultValue={item.urgency || 'Urgent'}><option>Critical</option><option>Urgent</option><option>Routine</option></Field>
        <Field label="Hospital / blood bank" name="hospital" required defaultValue={item.hospital} placeholder="Hospital name" />
        <Field label="City" name="city" required defaultValue={item.city} placeholder="City" />
        <Field label="State / region" name="state" defaultValue={item.state} placeholder="State" />
        <Field label="Needed by" name="neededBy" required type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={emptyDate(item.neededBy)} />
        <Field label="Contact person" name="contactName" required defaultValue={item.contactName} placeholder="Your name" />
        <Field label="Contact phone" name="contactPhone" required type="tel" defaultValue={item.contactPhone} placeholder="+1 555 010 2345" />
        <Field label="Request status" name="status" select defaultValue={item.status || 'Open'}><option>Open</option><option>In progress</option><option>Fulfilled</option></Field>
        <Field label="Additional details (optional)" name="details" className="field-full" defaultValue={item.details} placeholder="Anything that could help a donor respond" />
      </>}
    </div><div className="modal-footer"><span><ShieldCheck size={14} /> Your information helps save lives.</span><div><button className="button button-light" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : (item._id ? 'Save changes' : donor ? 'Register as donor' : 'Post request')} {!saving && <ArrowRight size={15} />}</button></div></div></form>
  </section></div>;
}

function Field({ label, name, select = false, className = '', children, ...props }) {
  return <label className={`form-field ${className}`}><span>{label}{props.required && <b> *</b>}</span>{select ? <select name={name} required={props.required} defaultValue={props.defaultValue}>{children}</select> : <input name={name} {...props} />}</label>;
}

export default App;
