'use client';

import { useState, useEffect, useCallback } from 'react';
import { inputStyle, fmtDate, StatusBadge } from './shared';

export default function DeliveryPartnersTab({ setMsg }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', vehicle_type: 'bike', assigned_areas: '' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/delivery-partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/delivery-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assigned_areas: form.assigned_areas ? form.assigned_areas.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ text: `Partner "${form.full_name}" created`, type: 'success' });
      setForm({ full_name: '', email: '', phone: '', vehicle_type: 'bike', assigned_areas: '' });
      setShowForm(false);
      fetchPartners();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(partner) {
    try {
      const res = await fetch('/api/admin/delivery-partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, is_active: !partner.is_active }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg({ text: `${partner.full_name} ${partner.is_active ? 'deactivated' : 'activated'}`, type: 'success' });
      fetchPartners();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  }

  const activeCount = partners.filter(p => p.is_active).length;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Partners', value: partners.length, bg: '#f5f5f0' },
          { label: 'Active', value: activeCount, bg: '#eef7e8' },
          { label: 'Inactive', value: partners.length - activeCount, bg: '#fdecea' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 20px', borderRadius: 12, background: s.bg, minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 0.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          background: '#1a2e1a', color: '#c8e6b0', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 20,
          letterSpacing: 0.3,
        }}
      >
        {showForm ? '✕ Cancel' : '+ Add Delivery Partner'}
      </button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#fafaf7', border: '1.5px solid #e4e4dc', borderRadius: 14, padding: 20, marginBottom: 24, maxWidth: 500 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#1a2e1a' }}>New Delivery Partner</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label style={labelStyle}>Phone (10 digits) *</label>
              <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required pattern="[6-9]\d{9}" />
            </div>
            <div>
              <label style={labelStyle}>Vehicle Type</label>
              <select style={inputStyle} value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}>
                <option value="bike">Bike</option>
                <option value="bicycle">Bicycle</option>
                <option value="walk">Walk</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigned Areas (comma-separated)</label>
              <input style={inputStyle} value={form.assigned_areas} onChange={e => setForm({ ...form, assigned_areas: e.target.value })} placeholder="e.g. Kukatpally, Madhapur" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 16, background: '#1a2e1a', color: '#c8e6b0', border: 'none',
              borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Creating…' : 'Create Partner'}
          </button>
        </form>
      )}

      {/* Partners list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading…</div>
      ) : partners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No delivery partners yet. Add one above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {partners.map(p => (
            <div key={p.id} style={{
              background: '#fff', border: '1.5px solid #e4e4dc', borderRadius: 14,
              padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexWrap: 'wrap', gap: 12, opacity: p.is_active ? 1 : 0.6,
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a', marginBottom: 4 }}>
                  {p.full_name}
                  <span style={{ marginLeft: 8 }}>
                    <StatusBadge status={p.is_active ? 'active' : 'cancelled'} />
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                  📞 {p.phone} · ✉ {p.user?.email || '—'}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                  🚲 {p.vehicle_type || 'bike'}
                  {p.assigned_areas?.length > 0 && ` · 📍 ${p.assigned_areas.join(', ')}`}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>
                  Added {fmtDate(p.created_at)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleActive(p)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: '1px solid #e4e4dc', cursor: 'pointer',
                    background: p.is_active ? '#fdecea' : '#eef7e8',
                    color: p.is_active ? '#b0281e' : '#3d6b2e',
                  }}
                >
                  {p.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4, letterSpacing: 0.3, textTransform: 'uppercase' };
