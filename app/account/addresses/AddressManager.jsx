'use client';

import { useState } from 'react';

const EMPTY = { full_name: '', phone: '', line1: '', line2: '', city: 'Tirupati', state: 'Andhra Pradesh', pincode: '' };

export default function AddressManager({ initialAddresses, lockedAddressIds, defaultPhone }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function startAdd() {
    setEditing('new');
    setForm({ ...EMPTY, phone: defaultPhone });
    setMsg(null);
  }

  function startEdit(a) {
    setEditing(a.id);
    setForm({
      full_name: a.full_name || '',
      phone: a.phone || '',
      line1: a.line1 || '',
      line2: a.line2 || '',
      city: a.city || 'Tirupati',
      state: a.state || 'Andhra Pradesh',
      pincode: a.pincode || '',
    });
    setMsg(null);
  }

  function cancel() {
    setEditing(null);
    setForm(EMPTY);
    setMsg(null);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const isNew = editing === 'new';
    const res = await fetch('/api/addresses', {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isNew ? form : { id: editing, ...form }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Save failed' });

    // Refresh list
    const list = await fetch('/api/addresses').then((r) => r.json());
    setAddresses(list.addresses || []);
    setEditing(null);
    setForm(EMPTY);
    setMsg({ type: 'success', text: isNew ? 'Address added.' : 'Address updated.' });
  }

  async function setDefault(id) {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, set_default: true }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      return setMsg({ type: 'error', text: data.error || 'Failed' });
    }
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })).sort((a, b) => Number(b.is_default) - Number(a.is_default)));
    setMsg({ type: 'success', text: 'Default address updated.' });
  }

  async function doDelete(id) {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/addresses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setBusy(false);
    setConfirmDelete(null);
    if (!res.ok) return setMsg({ type: 'error', text: data.error || 'Delete failed' });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setMsg({ type: 'success', text: 'Address removed.' });
  }

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="addr-card">
      {msg && (
        <div className={`addr-msg addr-msg--${msg.type}`}>{msg.text}</div>
      )}

      {addresses.length === 0 && editing !== 'new' && (
        <div className="addr-empty">
          <span className="addr-empty-icon">📍</span>
          <p>You haven't saved any addresses yet.</p>
          <button className="addr-btn-primary" onClick={startAdd}>+ Add your first address</button>
        </div>
      )}

      {addresses.length > 0 && editing !== 'new' && (
        <div className="addr-list">
          {addresses.map((a) => {
            const isEditing = editing === a.id;
            const isLocked = lockedAddressIds.includes(a.id);
            if (isEditing) return <AddressForm key={a.id} form={form} upd={upd} onSave={save} onCancel={cancel} busy={busy} />;
            return (
              <div className={`addr-item${a.is_default ? ' addr-item--default' : ''}`} key={a.id}>
                <div className="addr-item-body">
                  <div className="addr-item-head">
                    <strong>{a.full_name}</strong>
                    {a.is_default && <span className="addr-tag addr-tag--default">DEFAULT</span>}
                    {isLocked && <span className="addr-tag addr-tag--locked">IN USE</span>}
                  </div>
                  <p className="addr-item-line">{[a.line1, a.line2].filter(Boolean).join(', ')}</p>
                  <p className="addr-item-line">{a.city}, {a.state} — {a.pincode}</p>
                  <p className="addr-item-phone">📞 {a.phone}</p>
                </div>
                <div className="addr-item-actions">
                  {!a.is_default && (
                    <button onClick={() => setDefault(a.id)} disabled={busy} className="addr-btn-link">Set as default</button>
                  )}
                  <button onClick={() => startEdit(a)} disabled={busy} className="addr-btn-link">Edit</button>
                  <button
                    onClick={() => setConfirmDelete(a.id)}
                    disabled={busy || isLocked}
                    className="addr-btn-link addr-btn-link--danger"
                    title={isLocked ? 'In use by an active subscription' : ''}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing === 'new' && (
        <AddressForm form={form} upd={upd} onSave={save} onCancel={cancel} busy={busy} isNew />
      )}

      {editing === null && addresses.length > 0 && (
        <button className="addr-btn-primary" onClick={startAdd}>+ Add new address</button>
      )}

      {confirmDelete && (
        <div className="addr-modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="addr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove this address?</h3>
            <p>This can't be undone. Future orders will use a different address.</p>
            <div className="addr-modal-actions">
              <button onClick={() => setConfirmDelete(null)} className="addr-btn-link">Cancel</button>
              <button onClick={() => doDelete(confirmDelete)} className="addr-btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddressForm({ form, upd, onSave, onCancel, busy, isNew }) {
  return (
    <form className="addr-form" onSubmit={onSave}>
      <h3>{isNew ? 'Add Address' : 'Edit Address'}</h3>
      <div className="addr-form-row">
        <label>Full Name</label>
        <input required value={form.full_name} onChange={(e) => upd('full_name', e.target.value)} />
      </div>
      <div className="addr-form-row">
        <label>Phone</label>
        <input
          required
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          value={form.phone}
          onChange={(e) => upd('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile"
        />
      </div>
      <div className="addr-form-row">
        <label>Address Line 1</label>
        <input required value={form.line1} onChange={(e) => upd('line1', e.target.value)} placeholder="Flat, House no., Street" />
      </div>
      <div className="addr-form-row">
        <label>Address Line 2 <span style={{ color: '#aaa' }}>(optional)</span></label>
        <input value={form.line2} onChange={(e) => upd('line2', e.target.value)} placeholder="Landmark, area" />
      </div>
      <div className="addr-form-2col">
        <div className="addr-form-row">
          <label>City</label>
          <input required value={form.city} onChange={(e) => upd('city', e.target.value)} />
        </div>
        <div className="addr-form-row">
          <label>State</label>
          <input required value={form.state} onChange={(e) => upd('state', e.target.value)} />
        </div>
      </div>
      <div className="addr-form-row">
        <label>Pincode</label>
        <input required pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e) => upd('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
      </div>
      <div className="addr-form-actions">
        <button type="button" onClick={onCancel} disabled={busy} className="addr-btn-link">Cancel</button>
        <button type="submit" disabled={busy} className="addr-btn-primary">
          {busy ? 'Saving…' : isNew ? 'Add Address' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
