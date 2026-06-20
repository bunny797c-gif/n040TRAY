'use client';

import { useState, useMemo, useEffect } from 'react';
import { inr, inputStyle } from './shared';

// ══════════════════════════════════════════════════════════════════════════
// Plans panel
// ══════════════════════════════════════════════════════════════════════════
function PlansPanel({ plans, setPlans, setMsg }) {
  const [busy, setBusy] = useState(false);

  async function savePlan(plan) {
    setBusy(true); setMsg?.(null);
    const res = await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Save failed' });
    setMsg?.({ type: 'ok', text: `Plan "${plan.name}" saved.` });
  }

  const grouped = useMemo(() => {
    const g = { single: [], couple: [], family: [] };
    plans.forEach((p) => { if (g[p.audience]) g[p.audience].push(p); });
    return g;
  }, [plans]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#999' }}>Live plans shown on the subscription page. Edits apply immediately after saving each row.</p>
      {Object.entries(grouped).map(([audience, audiencePlans]) => (
        <div key={audience}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#4a7c59' }}>
            {audience === 'single' ? '🧍 Single' : audience === 'couple' ? '👫 Couple' : '👨‍👩‍👧 Family'}
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9f6' }}>
                  {['Name', 'Price (₹)', 'Deliveries', 'Serving label', 'Varieties label', 'Save %', 'Tag', 'Active', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audiencePlans.map((p) => {
                  const i = plans.findIndex((x) => x.id === p.id);
                  return (
                    <tr key={p.id}>
                      {[['name', 'Name', 140], ['price_inr', 'Price', 80], ['deliveries', 'Deliveries', 70], ['serving_label', 'Serving', 170], ['varieties_label', 'Varieties', 170], ['savings_pct', 'Save %', 55], ['tag', 'Tag', 90]].map(([k, label, w]) => (
                        <td key={k} data-label={label} style={{ padding: '8px 6px' }}>
                          <input style={{ ...inputStyle, padding: '8px 10px', width: w, maxWidth: '100%' }} value={plans[i]?.[k] ?? ''} onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} />
                        </td>
                      ))}
                      <td data-label="Active" style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input type="checkbox" checked={Boolean(plans[i]?.is_active)} onChange={(e) => setPlans((ps) => ps.map((x, j) => j === i ? { ...x, is_active: e.target.checked } : x))} />
                      </td>
                      <td data-label="" style={{ padding: '8px 10px' }}>
                        <button onClick={() => savePlan(plans[i])} disabled={busy} style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>SAVE</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Locations panel (serviceable pincodes + localities)
// ══════════════════════════════════════════════════════════════════════════
function LocationsPanel({ pincodes, setPincodes, setMsg }) {
  const [newPin, setNewPin] = useState({ pincode: '', city: '', state: 'Andhra Pradesh' });
  const [busy, setBusy] = useState(false);
  const [expandedPin, setExpandedPin] = useState(null);
  const [localities, setLocalities] = useState({});
  const [newLocality, setNewLocality] = useState({ name: '', type: 'area' });
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState('area');
  const [fetchedFromApi, setFetchedFromApi] = useState({});
  const [selectedFetched, setSelectedFetched] = useState({});
  const [fetching, setFetching] = useState(false);

  async function addPincode() {
    if (!/^\d{6}$/.test(newPin.pincode) || !newPin.city) return setMsg?.({ type: 'error', text: 'Enter a 6-digit pincode and a city.' });
    setBusy(true); setMsg?.(null);
    const res = await fetch('/api/admin/pincodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', ...newPin }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Failed' });
    setPincodes((p) => [...p.filter((x) => x.pincode !== newPin.pincode), data.row].sort((a, b) => a.pincode.localeCompare(b.pincode)));
    setNewPin({ pincode: '', city: '', state: newPin.state });
    setMsg?.({ type: 'ok', text: 'Pincode added.' });
  }

  async function togglePincode(row) {
    setBusy(true);
    const res = await fetch('/api/admin/pincodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', pincode: row.pincode, is_active: !row.is_active }) });
    setBusy(false);
    if (res.ok) setPincodes((p) => p.map((x) => x.pincode === row.pincode ? { ...x, is_active: !row.is_active } : x));
  }

  async function loadLocalities(pincode) {
    const res = await fetch(`/api/admin/localities?pincode=${pincode}`);
    const data = await res.json();
    if (res.ok) setLocalities((prev) => ({ ...prev, [pincode]: data.localities }));
  }

  async function toggleExpand(pincode) {
    if (expandedPin === pincode) { setExpandedPin(null); return; }
    setExpandedPin(pincode);
    setNewLocality({ name: '', type: 'area' });
    setBulkText('');
    if (!localities[pincode]) await loadLocalities(pincode);
  }

  async function addLocality(pincode) {
    if (!newLocality.name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/admin/localities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', pincode, name: newLocality.name, locality_type: newLocality.type }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Failed' });
    setLocalities((prev) => ({ ...prev, [pincode]: [...(prev[pincode] || []), data.locality].sort((a, b) => a.name.localeCompare(b.name)) }));
    setNewLocality({ name: '', type: newLocality.type });
    setMsg?.({ type: 'ok', text: `Added "${data.locality.name}"` });
  }

  async function bulkAddLocalities(pincode) {
    const names = bulkText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setBusy(true);
    const res = await fetch('/api/admin/localities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk_add', pincode, names, locality_type: bulkType }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Failed' });
    setLocalities((prev) => ({ ...prev, [pincode]: [...(prev[pincode] || []).filter((l) => !data.localities.find((n) => n.id === l.id)), ...data.localities].sort((a, b) => a.name.localeCompare(b.name)) }));
    setBulkText('');
    setMsg?.({ type: 'ok', text: `Added ${data.localities.length} localities` });
  }

  async function toggleLocality(pincode, loc) {
    const res = await fetch('/api/admin/localities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id: loc.id, is_active: !loc.is_active }) });
    if (res.ok) setLocalities((prev) => ({ ...prev, [pincode]: (prev[pincode] || []).map((l) => l.id === loc.id ? { ...l, is_active: !loc.is_active } : l) }));
  }

  async function deleteLocality(pincode, loc) {
    if (!confirm(`Delete "${loc.name}"?`)) return;
    const res = await fetch('/api/admin/localities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: loc.id }) });
    if (res.ok) setLocalities((prev) => ({ ...prev, [pincode]: (prev[pincode] || []).filter((l) => l.id !== loc.id) }));
  }

  async function fetchFromIndiaPost(pincode) {
    setFetching(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const json = await res.json();
      if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length) {
        const existingNames = new Set((localities[pincode] || []).map((l) => l.name.toLowerCase()));
        const offices = json[0].PostOffice.map((po) => ({
          name: po.Name,
          type: po.BranchType === 'Head Post Office' ? 'town' : 'area',
          block: po.Block,
        })).filter((o) => !existingNames.has(o.name.toLowerCase()));
        setFetchedFromApi((prev) => ({ ...prev, [pincode]: offices }));
        const all = {};
        offices.forEach((_, i) => { all[i] = true; });
        setSelectedFetched((prev) => ({ ...prev, [pincode]: all }));
        if (offices.length === 0) setMsg?.({ type: 'ok', text: 'All localities from India Post are already added.' });
      } else {
        setMsg?.({ type: 'error', text: 'No data found from India Post for this pincode.' });
        setFetchedFromApi((prev) => ({ ...prev, [pincode]: [] }));
      }
    } catch {
      setMsg?.({ type: 'error', text: 'Failed to fetch from India Post API.' });
    }
    setFetching(false);
  }

  function toggleFetchedSelection(pincode, idx) {
    setSelectedFetched((prev) => ({
      ...prev,
      [pincode]: { ...(prev[pincode] || {}), [idx]: !(prev[pincode] || {})[idx] },
    }));
  }

  function selectAllFetched(pincode, select) {
    const all = {};
    (fetchedFromApi[pincode] || []).forEach((_, i) => { all[i] = select; });
    setSelectedFetched((prev) => ({ ...prev, [pincode]: all }));
  }

  async function saveSelectedFetched(pincode) {
    const offices = fetchedFromApi[pincode] || [];
    const sel = selectedFetched[pincode] || {};
    const names = offices.filter((_, i) => sel[i]).map((o) => o.name);
    if (!names.length) return setMsg?.({ type: 'error', text: 'Select at least one locality to save.' });
    setBusy(true);
    const res = await fetch('/api/admin/localities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk_add', pincode, names, locality_type: 'area' }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg?.({ type: 'error', text: data.error || 'Failed' });
    setLocalities((prev) => ({ ...prev, [pincode]: [...(prev[pincode] || []).filter((l) => !data.localities.find((n) => n.id === l.id)), ...data.localities].sort((a, b) => a.name.localeCompare(b.name)) }));
    setFetchedFromApi((prev) => ({ ...prev, [pincode]: [] }));
    setSelectedFetched((prev) => ({ ...prev, [pincode]: {} }));
    setMsg?.({ type: 'ok', text: `Saved ${data.localities.length} localities from India Post` });
  }

  const TYPE_LABELS = { village: '🏘️ Village', street: '🛣️ Street', colony: '🏠 Colony', road: '🚗 Road', area: '📍 Area', town: '🏙️ Town' };

  return (
    <div style={{ maxWidth: 700 }}>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#999' }}>
        Manage pincodes and their localities (villages, streets, colonies). Customers select their locality during signup and checkout.
      </p>

      {/* Add pincode */}
      <div style={{ background: '#f9f9f6', borderRadius: 14, padding: 18, marginBottom: 24, border: '1px solid #eee' }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 }}>Add Pincode</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, width: 110 }} placeholder="Pincode" maxLength={6} value={newPin.pincode} onChange={(e) => setNewPin((n) => ({ ...n, pincode: e.target.value.replace(/\D/g, '') }))} />
          <input style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="City" value={newPin.city} onChange={(e) => setNewPin((n) => ({ ...n, city: e.target.value }))} />
          <input style={{ ...inputStyle, width: 160 }} placeholder="State" value={newPin.state} onChange={(e) => setNewPin((n) => ({ ...n, state: e.target.value }))} />
          <button onClick={addPincode} disabled={busy} style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>ADD</button>
        </div>
      </div>

      {/* Pincodes list */}
      <div style={{ borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
        {pincodes.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 13 }}>No pincodes yet.</p>}
        {pincodes.map((row) => {
          const isExpanded = expandedPin === row.pincode;
          const locs = localities[row.pincode] || [];
          const activeCount = locs.filter((l) => l.is_active).length;
          return (
            <div key={row.pincode} style={{ borderBottom: '1px solid #f0f0ea' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', fontSize: 14, background: isExpanded ? '#f7fbf3' : '#fff', cursor: 'pointer' }} onClick={() => toggleExpand(row.pincode)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{isExpanded ? '▼' : '▶'}</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{row.pincode}</strong>
                  <span style={{ color: '#888' }}>{row.city}, {row.state}</span>
                  {locs.length > 0 && <span style={{ fontSize: 11, color: '#4a7c59', background: '#e8f5e0', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{activeCount} localities</span>}
                </span>
                <button onClick={(e) => { e.stopPropagation(); togglePincode(row); }} disabled={busy} style={{ border: 'none', borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 11, cursor: 'pointer', background: row.is_active ? '#e8f5e0' : '#fdecea', color: row.is_active ? '#3d6b2e' : '#b0281e' }}>
                  {row.is_active ? '✓ Active' : '✗ Disabled'}
                </button>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 16px 16px', background: '#fafdf7' }}>
                  {/* Auto-fetch from India Post */}
                  {!(fetchedFromApi[row.pincode]?.length > 0) && (
                    <button
                      onClick={() => fetchFromIndiaPost(row.pincode)}
                      disabled={fetching || busy}
                      style={{ marginTop: 12, width: '100%', background: 'linear-gradient(135deg, #4a7c59, #3d6b2e)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {fetching ? '⏳ Fetching…' : '🔍 Auto-fetch localities from India Post'}
                    </button>
                  )}

                  {(fetchedFromApi[row.pincode]?.length > 0) && (
                    <div style={{ marginTop: 12, background: '#fff', borderRadius: 10, border: '1px solid #dce8d4', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 12px', background: '#e8f5e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3d6b2e' }}>
                          📮 {fetchedFromApi[row.pincode].length} localities found from India Post
                        </span>
                        <span style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => selectAllFetched(row.pincode, true)} style={{ border: 'none', background: 'none', color: '#4a7c59', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Select all</button>
                          <button onClick={() => selectAllFetched(row.pincode, false)} style={{ border: 'none', background: 'none', color: '#999', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Deselect all</button>
                        </span>
                      </div>
                      <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
                        {fetchedFromApi[row.pincode].map((office, idx) => {
                          const checked = (selectedFetched[row.pincode] || {})[idx];
                          return (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, background: idx % 2 === 0 ? '#fff' : '#fafaf7' }}>
                              <input type="checkbox" checked={!!checked} onChange={() => toggleFetchedSelection(row.pincode, idx)} style={{ accentColor: '#4a7c59' }} />
                              <span style={{ fontWeight: 600, color: '#333' }}>{office.name}</span>
                              {office.block && <span style={{ fontSize: 10, color: '#aaa' }}>({office.block})</span>}
                            </label>
                          );
                        })}
                      </div>
                      <div style={{ padding: '10px 12px', borderTop: '1px solid #e8e8e0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setFetchedFromApi((prev) => ({ ...prev, [row.pincode]: [] })); setSelectedFetched((prev) => ({ ...prev, [row.pincode]: {} })); }} style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer', color: '#888' }}>Cancel</button>
                        <button onClick={() => saveSelectedFetched(row.pincode)} disabled={busy} style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          💾 Save selected ({Object.values(selectedFetched[row.pincode] || {}).filter(Boolean).length})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add single locality */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input style={{ ...inputStyle, flex: 1, minWidth: 160 }} placeholder="Locality name (e.g. Tiruchanoor)" value={newLocality.name} onChange={(e) => setNewLocality((n) => ({ ...n, name: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addLocality(row.pincode)} />
                    <select style={{ ...inputStyle, width: 'auto', padding: '8px 12px', cursor: 'pointer' }} value={newLocality.type} onChange={(e) => setNewLocality((n) => ({ ...n, type: e.target.value }))}>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button onClick={() => addLocality(row.pincode)} disabled={busy || !newLocality.name.trim()} style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add</button>
                  </div>

                  {/* Bulk add */}
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ fontSize: 11, color: '#888', cursor: 'pointer', fontWeight: 600 }}>Bulk add (one per line)</summary>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <textarea style={{ ...inputStyle, flex: 1, minWidth: 200, minHeight: 70, resize: 'vertical', fontSize: 12 }} placeholder="Tiruchanoor&#10;Chandragiri&#10;Renigunta" value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <select style={{ ...inputStyle, padding: '6px 10px', fontSize: 11 }} value={bulkType} onChange={(e) => setBulkType(e.target.value)}>
                          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <button onClick={() => bulkAddLocalities(row.pincode)} disabled={busy || !bulkText.trim()} style={{ background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Add all</button>
                      </div>
                    </div>
                  </details>

                  {/* Localities list */}
                  {locs.length > 0 && (
                    <div style={{ marginTop: 14, borderRadius: 10, border: '1px solid #e8e8e0', overflow: 'hidden' }}>
                      {locs.map((loc, i) => (
                        <div key={loc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 13, background: i % 2 === 0 ? '#fff' : '#fafaf7', borderBottom: i < locs.length - 1 ? '1px solid #f0f0ea' : 'none', opacity: loc.is_active ? 1 : 0.5 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, color: '#aaa', background: '#f0f0ea', padding: '1px 6px', borderRadius: 6, fontWeight: 600, textTransform: 'uppercase' }}>{loc.locality_type}</span>
                            <span style={{ fontWeight: 600, color: '#333' }}>{loc.name}</span>
                          </span>
                          <span style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => toggleLocality(row.pincode, loc)} style={{ border: 'none', borderRadius: 12, padding: '3px 10px', fontWeight: 700, fontSize: 10, cursor: 'pointer', background: loc.is_active ? '#e8f5e0' : '#fdecea', color: loc.is_active ? '#3d6b2e' : '#b0281e' }}>
                              {loc.is_active ? '✓' : '✗'}
                            </button>
                            <button onClick={() => deleteLocality(row.pincode, loc)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>🗑️</button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {locs.length === 0 && <p style={{ margin: '14px 0 0', fontSize: 12, color: '#bbb', textAlign: 'center' }}>No localities added yet. Add villages, streets, colonies for this pincode.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Varieties panel (microgreens catalog)
// ══════════════════════════════════════════════════════════════════════════
const FAMILY_COLORS = {
  Asteraceae: { bg: '#fdf6e0', color: '#7a5c00' }, Brassicaceae: { bg: '#e8f5e0', color: '#3d6b2e' },
  Fabaceae: { bg: '#e0f0e8', color: '#1e5e44' }, Poaceae: { bg: '#f0ede0', color: '#6b5a2e' },
  Amaranthaceae: { bg: '#fde8f5', color: '#7a2e60' }, Apiaceae: { bg: '#e8edf5', color: '#2e4a80' },
  Lamiaceae: { bg: '#f5e8f0', color: '#6b2e5a' }, Polygonaceae: { bg: '#fdecea', color: '#8b2020' },
  Tropaeolaceae: { bg: '#fff4e0', color: '#8b5e00' }, Amaryllidaceae: { bg: '#e8f0f5', color: '#2e5a70' },
  Mixed: { bg: '#f0f0f0', color: '#555' },
};

function VarietiesPanel({ setMsg }) {
  const [varieties, setVarieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [showOnlyHome, setShowOnlyHome] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [newV, setNewV] = useState({ name: '', family: '', taste: '', description: '', price_100g: 249, price_200g: 449, price_500g: 999 });
  const [editingPrices, setEditingPrices] = useState({});
  const [editingFields, setEditingFields] = useState({});
  const [savingFields, setSavingFields] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetch('/api/admin/microgreens').then((r) => r.json()).then((d) => { setVarieties(d.varieties || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const families = useMemo(() => {
    const s = new Set(varieties.map((v) => v.family).filter(Boolean));
    return ['all', ...Array.from(s).sort()];
  }, [varieties]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return varieties.filter((v) => {
      const matchSearch = !q || v.name.toLowerCase().includes(q) || v.family?.toLowerCase().includes(q) || v.taste?.toLowerCase().includes(q);
      const matchFamily = familyFilter === 'all' || v.family === familyFilter;
      const matchHome = !showOnlyHome || v.show_on_home;
      return matchSearch && matchFamily && matchHome;
    });
  }, [varieties, search, familyFilter, showOnlyHome]);

  const visibleOnHome = varieties.filter((v) => v.show_on_home).length;

  async function patch(id, updates) {
    const res = await fetch('/api/admin/microgreens', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    if (!res.ok) { const d = await res.json(); setMsg?.({ type: 'error', text: d.error || 'Update failed' }); return false; }
    return true;
  }

  async function toggleHome(v) {
    const next = !v.show_on_home;
    setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, show_on_home: next } : x));
    const ok = await patch(v.id, { show_on_home: next });
    if (!ok) setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, show_on_home: v.show_on_home } : x));
    else setMsg?.({ type: 'ok', text: `${v.name} ${next ? 'added to catalog ✅' : 'removed from catalog'}.` });
  }
  async function toggleFeatured(v) {
    const next = !v.featured_home;
    setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, featured_home: next } : x));
    const ok = await patch(v.id, { featured_home: next });
    if (!ok) setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, featured_home: v.featured_home } : x));
    else setMsg?.({ type: 'ok', text: `${v.name} ${next ? 'now showing on the homepage ✅' : 'removed from the homepage'}.` });
  }
  async function toggleOos(v) {
    const next = !v.out_of_stock;
    setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, out_of_stock: next } : x));
    const ok = await patch(v.id, { out_of_stock: next });
    if (!ok) setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, out_of_stock: v.out_of_stock } : x));
    else setMsg?.({ type: 'ok', text: `${v.name} marked as ${next ? 'out of stock ✗' : 'in stock ✅'}.` });
  }

  async function uploadImage(v, file) {
    if (!file) return;
    setUploading(v.id);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    setUploading(null);
    if (!res.ok) { setMsg?.({ type: 'error', text: data.error || 'Upload failed' }); return; }
    const ok = await patch(v.id, { image_url: data.url });
    if (ok) { setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, image_url: data.url } : x)); setMsg?.({ type: 'ok', text: `Image uploaded for ${v.name}.` }); }
  }

  async function addVariety() {
    if (!newV.name.trim()) return;
    setAddBusy(true);
    const res = await fetch('/api/admin/microgreens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newV) });
    const data = await res.json();
    setAddBusy(false);
    if (!res.ok) { setMsg?.({ type: 'error', text: data.error || 'Failed to add variety' }); return; }
    setVarieties((prev) => [...prev, data.variety]);
    setNewV({ name: '', family: '', taste: '', description: '', price_100g: 249, price_200g: 449, price_500g: 999 });
    setShowAddForm(false);
    setMsg?.({ type: 'ok', text: `${data.variety.name} added! Upload an image and enable it in the catalog.` });
  }

  async function savePrices(v) {
    const ep = editingPrices[v.id];
    if (!ep) return;
    const ok = await patch(v.id, { price_100g: Number(ep.price_100g), price_200g: Number(ep.price_200g), price_500g: Number(ep.price_500g) });
    if (ok) { setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, ...ep } : x)); setEditingPrices((prev) => { const n = { ...prev }; delete n[v.id]; return n; }); setMsg?.({ type: 'ok', text: `Prices updated for ${v.name}.` }); }
  }

  async function saveFields(v) {
    const ef = editingFields[v.id];
    if (!ef) return;
    setSavingFields(v.id);
    const ok = await patch(v.id, ef);
    setSavingFields(null);
    if (ok) { setVarieties((prev) => prev.map((x) => x.id === v.id ? { ...x, ...ef } : x)); setEditingFields((prev) => { const n = { ...prev }; delete n[v.id]; return n; }); setMsg?.({ type: 'ok', text: `${ef.name || v.name} updated.` }); }
  }

  async function deleteVariety(id) {
    setConfirmDelete(null);
    const res = await fetch('/api/admin/microgreens', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (!res.ok) { const d = await res.json(); setMsg?.({ type: 'error', text: d.error || 'Delete failed' }); return; }
    setVarieties((prev) => prev.filter((x) => x.id !== id));
    setMsg?.({ type: 'ok', text: 'Variety removed.' });
  }

  function startEditing(v) {
    setEditingFields((prev) => ({ ...prev, [v.id]: { name: v.name || '', family: v.family || '', taste: v.taste || '', description: v.description || '', benefits: v.benefits || '', grow_time: v.grow_time || '', daily_intake: v.daily_intake || '', tag: v.tag || '' } }));
    setExpandedId(v.id);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>Loading varieties…</div>;

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ background: '#eef5e6', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#3d6b2e' }}>🌱 {varieties.length} varieties</div>
        <div style={{ background: '#fff4e0', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#9a6200' }}>✅ {visibleOnHome} in catalog</div>
        <div style={{ background: '#fdecea', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#b0281e' }}>✗ {varieties.filter((v) => v.out_of_stock).length} out of stock</div>
        <div style={{ background: '#e8edf5', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#3a5080' }}>🏠 {varieties.filter((v) => v.featured_home).length} on homepage</div>
        <button onClick={() => setShowAddForm(true)} style={{ marginLeft: 'auto', background: '#1a2e1a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3 }}>+ Add Variety</button>
      </div>

      {/* Add modal */}
      {showAddForm && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="admin-modal admin-modal--wide">
            <div className="admin-modal-head"><h3>Add New Variety</h3><button onClick={() => setShowAddForm(false)} className="admin-modal-x">×</button></div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{ label: 'Name *', key: 'name', placeholder: 'e.g. Basil' }, { label: 'Family', key: 'family', placeholder: 'e.g. Lamiaceae' }, { label: 'Taste', key: 'taste', placeholder: 'e.g. Sweet, aromatic' }, { label: 'Description', key: 'description', placeholder: 'Short description…' }].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input value={newV[key]} onChange={(e) => setNewV((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }}>Prices (₹)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['100g', 'price_100g'], ['200g', 'price_200g'], ['500g', 'price_500g']].map(([label, key]) => (
                      <div key={key}>
                        <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{label}</div>
                        <input type="number" value={newV[key]} onChange={(e) => setNewV((p) => ({ ...p, [key]: e.target.value }))} style={{ ...inputStyle, padding: '8px 10px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="admin-modal-actions">
                <button onClick={() => setShowAddForm(false)} className="admin-btn-ghost">Cancel</button>
                <button onClick={addVariety} disabled={addBusy || !newV.name.trim()} className="admin-btn-primary">{addBusy ? 'Adding…' : 'Add Variety'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#aaa' }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search varieties, family, taste…" style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '10px 14px', cursor: 'pointer' }}>
          {families.map((f) => <option key={f} value={f}>{f === 'all' ? 'All families' : f}</option>)}
        </select>
        <button onClick={() => setShowOnlyHome((x) => !x)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: showOnlyHome ? '#4a7c59' : '#f0f0ea', color: showOnlyHome ? '#fff' : '#666' }}>✅ Active only</button>
        <span style={{ fontSize: 13, color: '#aaa', marginLeft: 4 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map((v) => {
          const fc = FAMILY_COLORS[v.family] || { bg: '#f0f0f0', color: '#555' };
          const isExpanded = expandedId === v.id;
          const isUploading = uploading === v.id;
          const ef = editingFields[v.id];
          const isEditing = Boolean(ef);
          return (
            <div key={v.id} style={{ background: '#fff', borderRadius: 16, border: `2px solid ${isEditing ? '#4a7c59' : v.out_of_stock ? '#f5c6a0' : v.show_on_home ? '#7ab55c' : '#eee'}`, overflow: 'hidden', boxShadow: v.show_on_home ? '0 2px 12px rgba(74,124,89,0.12)' : '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ height: 140, background: '#f7fbf3', position: 'relative', overflow: 'hidden' }}>
                {v.image_url ? <img src={v.image_url} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#bbb' }}><span style={{ fontSize: 32 }}>🌿</span><span style={{ fontSize: 11 }}>No image yet</span></div>}
                <label style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(26,46,26,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, cursor: 'pointer' }}>
                  {isUploading ? '⏳ Uploading…' : '📷 Upload'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={isUploading} onChange={(e) => uploadImage(v, e.target.files[0])} />
                </label>
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {v.show_on_home && <div style={{ background: '#7ab55c', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>✅ IN CATALOG</div>}
                  {v.featured_home && <div style={{ background: '#5c7aaa', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>🏠 HOMEPAGE</div>}
                  {v.out_of_stock && <div style={{ background: '#e07b39', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>✗ OUT OF STOCK</div>}
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? <input value={ef.name} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], name: e.target.value } }))} style={{ ...inputStyle, fontSize: 15, fontWeight: 800, marginBottom: 6 }} /> : <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a2e1a' }}>{v.name}</h3>}
                    {isEditing ? <input value={ef.family} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], family: e.target.value } }))} placeholder="Family" style={{ ...inputStyle, fontSize: 11, padding: '3px 8px' }} /> : <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: fc.bg, color: fc.color }}>{v.family}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveFields(v)} disabled={savingFields === v.id} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#4a7c59', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{savingFields === v.id ? '…' : 'Save'}</button>
                        <button onClick={() => setEditingFields((p) => { const n = { ...p }; delete n[v.id]; return n; })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f5f5f0', color: '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                      </>
                    ) : <button onClick={() => startEditing(v)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #d0e4c8', background: '#f7fbf3', color: '#4a7c59', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✏️ Edit</button>}
                  </div>
                </div>

                {isEditing ? (
                  <>
                    <input value={ef.taste} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], taste: e.target.value } }))} placeholder="Taste / flavour notes" style={{ ...inputStyle, fontSize: 12, marginBottom: 6 }} />
                    <input value={ef.tag} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], tag: e.target.value } }))} placeholder="Tag (e.g. SPICY, MILD)" style={{ ...inputStyle, fontSize: 12, marginBottom: 6 }} />
                    <input value={ef.grow_time} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], grow_time: e.target.value } }))} placeholder="Grow time (e.g. 7–10 days)" style={{ ...inputStyle, fontSize: 12, marginBottom: 6 }} />
                    <input value={ef.daily_intake} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], daily_intake: e.target.value } }))} placeholder="Daily intake (e.g. 20–30g)" style={{ ...inputStyle, fontSize: 12, marginBottom: 6 }} />
                    <textarea value={ef.description} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], description: e.target.value } }))} placeholder="Description" rows={2} style={{ ...inputStyle, fontSize: 12, marginBottom: 6, resize: 'vertical' }} />
                    <textarea value={ef.benefits} onChange={(e) => setEditingFields((p) => ({ ...p, [v.id]: { ...p[v.id], benefits: e.target.value } }))} placeholder="Benefits" rows={2} style={{ ...inputStyle, fontSize: 12, resize: 'vertical' }} />
                  </>
                ) : <p style={{ margin: '0 0 10px', fontSize: 12, color: '#666', fontStyle: 'italic' }}>✦ {v.taste}</p>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, background: '#f9f9f6', borderRadius: 10, padding: '10px 12px' }}>
                  {[['Show in catalog', v.show_on_home, '#7ab55c', () => toggleHome(v)], ['Show on homepage', v.featured_home, '#5c7aaa', () => toggleFeatured(v)], ['Out of stock', v.out_of_stock, '#e07b39', () => toggleOos(v)]].map(([label, on, col, fn]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{label}</span>
                      <button onClick={fn} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? col : '#ddd', position: 'relative', flexShrink: 0 }}>
                        <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: '#f7fbf3', borderRadius: 8, padding: '7px 10px', fontSize: 11 }}><div style={{ color: '#aaa', marginBottom: 2 }}>Grow time</div><div style={{ fontWeight: 700, color: '#333' }}>{v.grow_time || '—'}</div></div>
                  <div style={{ flex: 1, background: '#f7fbf3', borderRadius: 8, padding: '7px 10px', fontSize: 11 }}><div style={{ color: '#aaa', marginBottom: 2 }}>Daily intake</div><div style={{ fontWeight: 700, color: '#333' }}>{v.daily_intake || '—'}</div></div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setExpandedId(isExpanded ? null : v.id)} style={{ flex: 1, background: '#f0f0ea', border: 'none', borderRadius: 8, padding: 7, fontSize: 12, fontWeight: 700, color: '#555', cursor: 'pointer' }}>{isExpanded ? '▲ Less info' : '▼ Full details'}</button>
                  <button onClick={() => setConfirmDelete(v)} style={{ background: '#fff5f5', border: '1px solid #f0c8c8', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, color: '#c0392b', cursor: 'pointer' }}>🗑️</button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Description</div><p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{v.description}</p></div>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Benefits</div><p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{v.benefits}</p></div>
                    <div style={{ background: '#f7fbf3', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>Prices (₹)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[['100g', 'price_100g'], ['200g', 'price_200g'], ['500g', 'price_500g']].map(([label, key]) => {
                          const ep = editingPrices[v.id];
                          const val = ep ? ep[key] : (v[key] ?? '');
                          return (
                            <div key={key}>
                              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{label}</div>
                              <input type="number" value={val} onChange={(e) => setEditingPrices((prev) => ({ ...prev, [v.id]: { price_100g: v.price_100g ?? 249, price_200g: v.price_200g ?? 449, price_500g: v.price_500g ?? 999, ...(prev[v.id] || {}), [key]: e.target.value } }))} style={{ width: '100%', padding: '7px 8px', borderRadius: 7, border: '1px solid #d0e4c8', fontSize: 13, fontWeight: 700, textAlign: 'center' }} />
                            </div>
                          );
                        })}
                      </div>
                      {editingPrices[v.id] && <button onClick={() => savePrices(v)} style={{ marginTop: 10, width: '100%', background: '#4a7c59', color: '#fff', border: 'none', borderRadius: 8, padding: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Save Prices</button>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {confirmDelete && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="admin-modal">
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#222' }}>Delete "{confirmDelete.name}"?</h3>
              <p style={{ margin: '0 0 22px', fontSize: 13, color: '#777' }}>This permanently removes the variety from your catalog. Existing orders stay intact.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirmDelete(null)} className="admin-btn-ghost">Cancel</button>
                <button onClick={() => deleteVariety(confirmDelete.id)} className="admin-btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Setup tab — pill switcher
// ══════════════════════════════════════════════════════════════════════════
const PANELS = [
  { id: 'plans', label: 'Plans', icon: '📋' },
  { id: 'varieties', label: 'Varieties', icon: '🥬' },
  { id: 'locations', label: 'Locations', icon: '📍' },
];

export default function SetupTab({ plans, setPlans, pincodes, setPincodes, setMsg }) {
  const [panel, setPanel] = useState('plans');
  return (
    <div>
      <div className="setup-pills">
        {PANELS.map((p) => (
          <button key={p.id} onClick={() => { setPanel(p.id); setMsg?.(null); }} className={`setup-pill${panel === p.id ? ' setup-pill--active' : ''}`}>
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>
      {panel === 'plans' && <PlansPanel plans={plans} setPlans={setPlans} setMsg={setMsg} />}
      {panel === 'varieties' && <VarietiesPanel setMsg={setMsg} />}
      {panel === 'locations' && <LocationsPanel pincodes={pincodes} setPincodes={setPincodes} setMsg={setMsg} />}
    </div>
  );
}
