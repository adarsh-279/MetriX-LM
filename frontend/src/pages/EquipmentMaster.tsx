import React, { useEffect, useState } from 'react';
import { Sliders, Plus, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, X } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../lib/useToast';

export default function EquipmentMaster() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    serial_number: '',
    type: 'standard_weights',
    accuracy_class: 'F1 (OIML R 111)',
    calibration_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    certificate_number: '',
  });
  const { show, node } = useToast();

  const load = async () => {
    try {
      const data = await api.equipment.list();
      setEquipment(data || []);
    } catch (err) {
      console.error('Error loading equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.serial_number || !form.certificate_number) {
      show('Please fill in Name, Serial Number, and Certificate Number.');
      return;
    }
    try {
      await api.equipment.create(form);
      show('Calibration standard registered');
      setShowModal(false);
      load();
    } catch (err: any) {
      show('Error: ' + err.message);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Calibration Equipment & Traceability Master</h2>
          <p>Traceable standard weights (OIML R 111) and calibrated environmental measuring instruments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Register Standard Equipment
        </button>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Type / Class</th>
              <th>Serial Number</th>
              <th>Certificate No.</th>
              <th>Calibration Date</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq.id}>
                <td style={{ fontWeight: 600 }}>{eq.name}</td>
                <td>
                  <span className="badge badge-class">{eq.accuracy_class || eq.type}</span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{eq.serial_number}</td>
                <td>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{eq.certificate_number}</code>
                </td>
                <td style={{ color: 'var(--c-text-muted)' }}>{eq.calibration_date}</td>
                <td style={{ color: 'var(--c-text-muted)' }}>{eq.due_date}</td>
                <td>
                  {eq.status === 'valid' ? (
                    <span className="badge badge-pass" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> VALID
                    </span>
                  ) : (
                    <span className="badge badge-fail" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={13} /> EXPIRED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Register Calibration Standard</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--c-text-muted)" />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Standard Equipment Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. E2 Class Stainless Steel Mass Set (1 mg – 1 kg)"
                />
              </div>
              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  className="form-input"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  placeholder="e.g. SN-E2-2026-09"
                />
              </div>
              <div className="form-group">
                <label>Accuracy Class (OIML R 111)</label>
                <input
                  className="form-input"
                  value={form.accuracy_class}
                  onChange={(e) => setForm({ ...form, accuracy_class: e.target.value })}
                  placeholder="e.g. E2, F1, M1"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Calibration Certificate Number *</label>
                <input
                  className="form-input"
                  value={form.certificate_number}
                  onChange={(e) => setForm({ ...form, certificate_number: e.target.value })}
                  placeholder="e.g. NPL/CAL/2026/0891"
                />
              </div>
              <div className="form-group">
                <label>Calibration Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.calibration_date}
                  onChange={(e) => setForm({ ...form, calibration_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Save Standard</button>
            </div>
          </div>
        </div>
      )}

      {node}
    </div>
  );
}
