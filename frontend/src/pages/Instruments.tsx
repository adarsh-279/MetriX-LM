import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Scale, X, Sparkles, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { validateInstrumentClass, fmt, type AccuracyClass } from '../lib/oiml';
import { useToast } from '../lib/useToast';
import AISpecModal from '../components/AISpecModal';

const emptyForm = {
  name: '',
  manufacturer: '',
  model: '',
  serial_number: '',
  accuracy_class: 'III' as AccuracyClass,
  max_capacity: '',
  verification_scale_interval: '',
  actual_scale_interval: '',
  min_capacity: '',
  tare_max: '',
  unit: 'kg',
  display_type: 'High-contrast 7-segment LED with backlight',
  load_receptor: 'Stainless Steel Platform 400x400mm',
  power_supply: '230V AC / Internal Battery',
  software_version: 'v1.0-LM',
  identification_markings: 'Laser-etched metal stamping plate affixed to rear chassis',
  photo_url: '',
};

export default function Instruments() {
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterClass, setFilterClass] = useState('all');
  const [search, setSearch] = useState('');
  const { show, node } = useToast();

  const load = async () => {
    try {
      const data = await api.instruments.list();
      setInstruments(data || []);
    } catch (err: any) {
      show('Error loading instruments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (ins: any) => {
    setEditing(ins);
    setForm({
      name: ins.name,
      manufacturer: ins.manufacturer || '',
      model: ins.model || '',
      serial_number: ins.serial_number || '',
      accuracy_class: ins.accuracy_class as AccuracyClass,
      max_capacity: String(ins.max_capacity),
      verification_scale_interval: String(ins.verification_scale_interval),
      actual_scale_interval: ins.actual_scale_interval ? String(ins.actual_scale_interval) : String(ins.verification_scale_interval),
      min_capacity: ins.min_capacity ? String(ins.min_capacity) : '',
      tare_max: ins.tare_max ? String(ins.tare_max) : '',
      unit: ins.unit || 'kg',
      display_type: ins.display_type || '',
      load_receptor: ins.load_receptor || '',
      power_supply: ins.power_supply || '',
      software_version: ins.software_version || '',
      identification_markings: ins.identification_markings || '',
      photo_url: ins.photo_url || '',
    });
    setShowModal(true);
  };

  const handleApplyAI = (extracted: any) => {
    setForm((f) => ({
      ...f,
      name: extracted.model ? `${extracted.manufacturer || 'NAWI'} ${extracted.model}` : f.name,
      manufacturer: extracted.manufacturer || f.manufacturer,
      model: extracted.model || f.model,
      serial_number: extracted.serial_number || f.serial_number,
      accuracy_class: (extracted.accuracy_class as AccuracyClass) || f.accuracy_class,
      max_capacity: extracted.max_capacity ? String(extracted.max_capacity) : f.max_capacity,
      verification_scale_interval: extracted.verification_scale_interval
        ? String(extracted.verification_scale_interval)
        : f.verification_scale_interval,
      actual_scale_interval: extracted.actual_scale_interval
        ? String(extracted.actual_scale_interval)
        : f.actual_scale_interval,
      min_capacity: extracted.min_capacity ? String(extracted.min_capacity) : f.min_capacity,
      tare_max: extracted.tare_max ? String(extracted.tare_max) : f.tare_max,
      unit: extracted.unit || f.unit,
    }));
    setShowModal(true);
    show('✨ AI parameters applied to registration form');
  };

  const save = async () => {
    if (!form.name || !form.manufacturer || !form.model || !form.max_capacity || !form.verification_scale_interval) {
      show('Please fill in Name, Manufacturer, Model, Max Capacity, and Scale Interval.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        manufacturer: form.manufacturer,
        model: form.model,
        serial_number: form.serial_number,
        accuracy_class: form.accuracy_class,
        max_capacity: parseFloat(form.max_capacity),
        verification_scale_interval: parseFloat(form.verification_scale_interval),
        actual_scale_interval: form.actual_scale_interval ? parseFloat(form.actual_scale_interval) : parseFloat(form.verification_scale_interval),
        min_capacity: form.min_capacity ? parseFloat(form.min_capacity) : undefined,
        tare_max: form.tare_max ? parseFloat(form.tare_max) : undefined,
        unit: form.unit,
        display_type: form.display_type,
        load_receptor: form.load_receptor,
        power_supply: form.power_supply,
        software_version: form.software_version,
        identification_markings: form.identification_markings,
        photo_url: form.photo_url,
      };

      if (editing) {
        await api.instruments.update(editing.id, payload);
        show('Instrument updated');
      } else {
        await api.instruments.create(payload);
        show('Instrument registered successfully');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      show('Validation Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this instrument and all its associated test cases?')) return;
    try {
      await api.instruments.delete(id);
      show('Instrument deleted');
      load();
    } catch (err: any) {
      show('Error deleting: ' + err.message);
    }
  };

  const filtered = instruments.filter((ins) => {
    const matchClass = filterClass === 'all' || ins.accuracy_class === filterClass;
    const matchSearch =
      !search ||
      ins.name.toLowerCase().includes(search.toLowerCase()) ||
      ins.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      ins.model.toLowerCase().includes(search.toLowerCase()) ||
      (ins.serial_number && ins.serial_number.toLowerCase().includes(search.toLowerCase()));
    return matchClass && matchSearch;
  });

  const maxNum = parseFloat(form.max_capacity);
  const eNum = parseFloat(form.verification_scale_interval);
  const liveValidation = maxNum && eNum ? validateInstrumentClass(form.accuracy_class, eNum, maxNum) : null;

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>NAWI Instruments Master</h2>
          <p>Registered Non-Automatic Weighing Instruments & Digital Passports (OIML R 76-1 Table 1)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowAIModal(true)}>
            <Sparkles size={16} color="var(--c-accent)" /> AI Spec Extractor
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Register NAWI
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'I', 'II', 'III', 'IIII'].map((c) => (
            <button
              key={c}
              className={`btn btn-sm ${filterClass === c ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterClass(c)}
            >
              {c === 'all' ? 'All Classes' : `Class ${c}`}
            </button>
          ))}
        </div>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search manufacturer, model, serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <Scale className="empty-icon" />
          <h3>No instruments found</h3>
          <p>Register a Non-Automatic Weighing Instrument or use the AI Spec Extractor to get started.</p>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Register NAWI
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Instrument & Model</th>
                <th>Manufacturer / Serial</th>
                <th>Accuracy Class</th>
                <th>Max / e</th>
                <th>Intervals (n)</th>
                <th>Digital Passport</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ins) => (
                <tr key={ins.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link to={`/instruments/${ins.id}/passport`} className="link">
                      {ins.name}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--c-text-subtle)', marginTop: 2 }}>{ins.model}</div>
                  </td>
                  <td>
                    <div>{ins.manufacturer}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-text-subtle)', marginTop: 2 }}>
                      SN: {ins.serial_number || '—'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-class">Class {ins.accuracy_class}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    Max {fmt(ins.max_capacity)} {ins.unit}
                    <div style={{ color: 'var(--c-text-subtle)', fontSize: 12 }}>
                      e = {fmt(ins.verification_scale_interval)} {ins.unit}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-muted)' }}>
                    n = {ins.number_of_scale_intervals?.toLocaleString() || '—'}
                  </td>
                  <td>
                    <Link
                      to={`/instruments/${ins.id}/passport`}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                    >
                      <ShieldCheck size={14} color="var(--c-primary)" /> Passport <ArrowRight size={12} />
                    </Link>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginRight: 6 }}
                      onClick={() => openEdit(ins)}
                      title="Edit specifications"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--c-error)', borderColor: 'var(--c-error)' }}
                      onClick={() => remove(ins.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register/Edit Instrument Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--c-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                {editing ? 'Edit NAWI Technical Passport' : 'Register Non-Automatic Weighing Instrument'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--c-text-muted)" />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Instrument Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Industrial Platform Scale"
                  />
                </div>

                <div className="form-group">
                  <label>Manufacturer *</label>
                  <input
                    className="form-input"
                    value={form.manufacturer}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                    placeholder="e.g. Mettler Toledo"
                  />
                </div>

                <div className="form-group">
                  <label>Model Designation *</label>
                  <input
                    className="form-input"
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. IND560"
                  />
                </div>

                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    className="form-input"
                    value={form.serial_number}
                    onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                    placeholder="e.g. SN-2026-00125"
                  />
                </div>

                <div className="form-group">
                  <label>Accuracy Class (OIML R 76 Table 1) *</label>
                  <select
                    className="form-select"
                    value={form.accuracy_class}
                    onChange={(e) => setForm((f) => ({ ...f, accuracy_class: e.target.value as AccuracyClass }))}
                  >
                    <option value="I">Class I (Special Accuracy)</option>
                    <option value="II">Class II (High Accuracy)</option>
                    <option value="III">Class III (Medium Accuracy)</option>
                    <option value="IIII">Class IIII (Ordinary Accuracy)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Maximum Capacity (Max) *</label>
                  <input
                    className="form-input input-numeric"
                    type="number"
                    step="any"
                    value={form.max_capacity}
                    onChange={(e) => setForm((f) => ({ ...f, max_capacity: e.target.value }))}
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="form-group">
                  <label>Scale Interval (e) *</label>
                  <input
                    className="form-input input-numeric"
                    type="number"
                    step="any"
                    value={form.verification_scale_interval}
                    onChange={(e) => setForm((f) => ({ ...f, verification_scale_interval: e.target.value }))}
                    placeholder="e.g. 0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Actual Interval (d)</label>
                  <input
                    className="form-input input-numeric"
                    type="number"
                    step="any"
                    value={form.actual_scale_interval}
                    onChange={(e) => setForm((f) => ({ ...f, actual_scale_interval: e.target.value }))}
                    placeholder="e.g. 0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Unit of Measure</label>
                  <select
                    className="form-select"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="mg">mg (Milligram)</option>
                    <option value="t">t (Tonne)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Minimum Capacity (Min)</label>
                  <input
                    className="form-input input-numeric"
                    type="number"
                    step="any"
                    value={form.min_capacity}
                    onChange={(e) => setForm((f) => ({ ...f, min_capacity: e.target.value }))}
                    placeholder="e.g. 0.2"
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Tare Limit (T)</label>
                  <input
                    className="form-input input-numeric"
                    type="number"
                    step="any"
                    value={form.tare_max}
                    onChange={(e) => setForm((f) => ({ ...f, tare_max: e.target.value }))}
                    placeholder="e.g. 10"
                  />
                </div>

                <div className="form-group">
                  <label>Display & Readout Type</label>
                  <input
                    className="form-input"
                    value={form.display_type}
                    onChange={(e) => setForm((f) => ({ ...f, display_type: e.target.value }))}
                    placeholder="e.g. 7-Segment LED / Graphic LCD"
                  />
                </div>

                <div className="form-group">
                  <label>Load Receptor Specification</label>
                  <input
                    className="form-input"
                    value={form.load_receptor}
                    onChange={(e) => setForm((f) => ({ ...f, load_receptor: e.target.value }))}
                    placeholder="e.g. Platform 400x400 mm"
                  />
                </div>

                <div className="form-group">
                  <label>Power Supply</label>
                  <input
                    className="form-input"
                    value={form.power_supply}
                    onChange={(e) => setForm((f) => ({ ...f, power_supply: e.target.value }))}
                    placeholder="e.g. 230V AC / 6V Battery"
                  />
                </div>

                <div className="form-group">
                  <label>Software Version / Checksum</label>
                  <input
                    className="form-input"
                    value={form.software_version}
                    onChange={(e) => setForm((f) => ({ ...f, software_version: e.target.value }))}
                    placeholder="e.g. v2.10-LM (CRC 0x8A4F)"
                  />
                </div>
              </div>

              {/* Real-time OIML Table 1 Validation Alert */}
              {liveValidation && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    background: liveValidation.valid ? 'var(--c-success-light)' : 'var(--c-error-light)',
                    color: liveValidation.valid ? 'var(--c-success)' : 'var(--c-error)',
                    border: `1px solid ${liveValidation.valid ? 'var(--c-success)' : 'var(--c-error)'}40`,
                  }}
                >
                  {liveValidation.valid ? (
                    `✓ OIML R 76-1 Table 1 Valid: n = ${liveValidation.n.toLocaleString()} scale intervals is within permissible limits for Class ${form.accuracy_class}.`
                  ) : (
                    `⚠ Metrological Parameter Inconsistency: ${liveValidation.reason}`
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--c-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Instrument' : 'Register Instrument'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Spec Extractor Modal */}
      <AISpecModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} onApply={handleApplyAI} />

      {node}
    </div>
  );
}
