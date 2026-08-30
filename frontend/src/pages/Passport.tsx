import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Scale,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  FileText,
  AlertTriangle,
  Camera,
  Layers,
  Calendar,
} from 'lucide-react';
import { api } from '../lib/api';
import { fmt } from '../lib/oiml';
import { useToast } from '../lib/useToast';

export default function Passport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [passport, setPassport] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [passData, readData] = await Promise.all([
          api.instruments.getPassport(id),
          api.instruments.getReadiness(id),
        ]);
        setPassport(passData);
        setReadiness(readData);
      } catch (err: any) {
        show('Error loading passport: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!passport) {
    return (
      <div className="empty-state">
        <h3>Instrument Digital Passport Not Found</h3>
        <Link to="/instruments" className="btn btn-primary">
          Back to Instruments
        </Link>
      </div>
    );
  }

  const ins = passport.instrument;
  const history = passport.test_history || [];

  return (
    <div>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/instruments" className="link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Back to Instruments
        </Link>
        <Link to={`/cases/new?instrument_id=${ins.id}`} className="btn btn-primary btn-sm">
          <Plus size={16} /> Start Evaluation for this NAWI
        </Link>
      </div>

      {/* Passport Header Card */}
      <div
        className="card card-pad"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1a3a52 0%, #0d6e6e 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius)',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={32} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    background: 'rgba(255,255,255,0.2)',
                    padding: '2px 8px',
                    borderRadius: 100,
                  }}
                >
                  DIGITAL INSTRUMENT PASSPORT
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: ins.status === 'approved' ? 'var(--c-success)' : '#f59e0b',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  {ins.status.replace('_', ' ')}
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{ins.name}</h1>
              <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                {ins.manufacturer} · Model: {ins.model} · Serial: {ins.serial_number}
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 18px',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.75, letterSpacing: 0.5 }}>
              OIML Accuracy Class
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fef08a' }}>Class {ins.accuracy_class}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Max {fmt(ins.max_capacity)} {ins.unit} / e = {fmt(ins.verification_scale_interval)} {ins.unit}
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Test Readiness Check Banner */}
      {readiness && (
        <div
          className="card"
          style={{
            padding: '18px 22px',
            marginBottom: 24,
            borderLeft: `4px solid ${readiness.ready ? 'var(--c-success)' : 'var(--c-warning)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              {readiness.ready ? (
                <CheckCircle2 size={18} color="var(--c-success)" />
              ) : (
                <AlertTriangle size={18} color="var(--c-warning)" />
              )}
              <span>Pre-Test Readiness Assessment: {readiness.status.replace(/_/g, ' ')}</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {readiness.checks.map((c: any) => (
              <div
                key={c.id}
                style={{
                  padding: '10px 12px',
                  background: 'var(--c-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: c.passed ? 'var(--c-success)' : 'var(--c-error)' }}>
                  {c.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <span>{c.name}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>{c.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrological Specifications Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Metrological & Technical Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
            <PassportRow label="Accuracy Class" value={`Class ${ins.accuracy_class}`} />
            <PassportRow label="Max Capacity (Max)" value={`${fmt(ins.max_capacity)} ${ins.unit}`} />
            <PassportRow label="Verification Interval (e)" value={`${fmt(ins.verification_scale_interval)} ${ins.unit}`} />
            <PassportRow label="Actual Scale Interval (d)" value={`${fmt(ins.actual_scale_interval)} ${ins.unit}`} />
            <PassportRow label="Min Capacity (Min)" value={ins.min_capacity ? `${fmt(ins.min_capacity)} ${ins.unit}` : '—'} />
            <PassportRow label="Verification Intervals (n)" value={ins.number_of_scale_intervals?.toLocaleString() || '—'} />
            <PassportRow label="Maximum Tare (T)" value={ins.tare_max ? `${fmt(ins.tare_max)} ${ins.unit}` : '—'} />
            <PassportRow label="Display Type" value={ins.display_type || '—'} />
            <PassportRow label="Load Receptor" value={ins.load_receptor || '—'} />
            <PassportRow label="Power Supply" value={ins.power_supply || '—'} />
            <PassportRow label="Software Version" value={ins.software_version || '—'} />
            <PassportRow label="Marking Plate" value={ins.identification_markings || '—'} />
          </div>
        </div>

        {/* Evaluation Summary & Track Record */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Compliance Track Record</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, background: 'var(--c-bg)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--c-text-subtle)', fontWeight: 600 }}>TOTAL EVALUATIONS</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{passport.total_evaluations}</div>
            </div>
            <div style={{ padding: 14, background: 'var(--c-success-light)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--c-success)', fontWeight: 600 }}>APPROVED CERTIFICATES</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-success)', marginTop: 4 }}>
                {passport.approved_evaluations}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
            <p>
              This Digital Instrument Passport maintains an auditable, persistent metrological lifecycle record for this Non-Automatic Weighing Instrument per SIH PS 26035.
            </p>
          </div>
        </div>
      </div>

      {/* Historical Evaluation Sessions Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Test Evaluation History & Certifications</h3>
          <Link to={`/cases/new?instrument_id=${ins.id}`} className="link" style={{ fontSize: 13 }}>
            + New Evaluation Run
          </Link>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--c-text-muted)' }}>
            No test evaluations recorded for this instrument yet.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Revision</th>
                <th>Test Date</th>
                <th>Reviewer</th>
                <th>Overall Outcome</th>
                <th>Status</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.case_id}>
                  <td>
                    <Link to={`/reports/${h.case_id}`} className="link" style={{ fontWeight: 600 }}>
                      {h.case_number}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-class">V{h.revision}</span>
                  </td>
                  <td>{h.test_date || '—'}</td>
                  <td>{h.reviewer_name || 'Pending Review'}</td>
                  <td>
                    {h.overall_result === 'pass' && <span className="badge badge-pass">PASS</span>}
                    {h.overall_result === 'fail' && <span className="badge badge-fail">FAIL</span>}
                    {h.overall_result === 'pending' && <span className="badge badge-pending">PENDING</span>}
                  </td>
                  <td>
                    <span className={`badge ${h.status === 'approved' ? 'badge-pass' : h.status === 'rejected' ? 'badge-fail' : 'badge-draft'}`}>
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <Link to={`/reports/${h.case_id}`} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                      <FileText size={13} /> View Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {node}
    </div>
  );
}

function PassportRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--c-border)' }}>
      <span style={{ color: 'var(--c-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
