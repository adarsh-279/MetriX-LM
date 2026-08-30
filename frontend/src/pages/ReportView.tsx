import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { fmt, fmtSigned } from '../lib/oiml';
import { useToast } from '../lib/useToast';

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const { show, node } = useToast();
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.reports.getSnapshot(id);
        setSnapshot(data);
      } catch (err: any) {
        show('Error loading report: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!snapshot) {
    return (
      <div className="empty-state">
        <h3>Test Report Not Found</h3>
        <Link to="/reports" className="btn btn-primary">
          Back to Reports
        </Link>
      </div>
    );
  }

  const ins = snapshot.instrument;
  const lab = snapshot.laboratory;
  const tests = snapshot.test_results;
  const allPass = snapshot.overall_result === 'pass';

  return (
    <div>
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link to="/reports" className="link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Back to Reports Repository
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={api.reports.getCSVUrl(id!)} download className="btn btn-outline" style={{ fontSize: 13 }}>
            <FileSpreadsheet size={16} /> Export CSV
          </a>
          <a href={api.reports.getJSONUrl(id!)} download className="btn btn-outline" style={{ fontSize: 13 }}>
            <FileCode size={16} /> JSON Certificate
          </a>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Standardized OIML R 76-2 Report Document */}
      <div className="card print-report" style={{ padding: '40px 48px', maxWidth: 960, margin: '0 auto', background: '#ffffff' }}>
        {/* Certificate Header */}
        <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '2px solid var(--c-secondary)', marginBottom: 24 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--c-text-muted)', fontWeight: 700 }}>
            {lab?.name || 'NATIONAL LEGAL METROLOGY TYPE-EVALUATION LABORATORY'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--c-text-subtle)', marginTop: 2 }}>
            {lab?.address || 'Department of Consumer Affairs, Government of India'} · Accreditation: {lab?.accreditation_number || 'NABL / OIML-TC9-IND'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginTop: 12, color: 'var(--c-secondary)' }}>
            TYPE-EVALUATION TEST REPORT (OIML R 76-2)
          </h1>
          <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            Non-Automatic Weighing Instruments (NAWI) — Metrological & Technical Compliance Certificate
          </p>

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 12 }}>
            <div>
              Report No: <strong>{snapshot.report_number}</strong>
            </div>
            <div>•</div>
            <div>
              Revision: <strong>V{snapshot.revision}</strong>
            </div>
            <div>•</div>
            <div>
              Standard: <strong>{snapshot.ruleset_id}</strong>
            </div>
          </div>
        </div>

        {/* Overall Compliance Outcome Banner */}
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 24,
            textAlign: 'center',
            background: allPass ? 'var(--c-success-light)' : 'var(--c-error-light)',
            border: `1px solid ${allPass ? 'var(--c-success)' : 'var(--c-error)'}`,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: allPass ? 'var(--c-success)' : 'var(--c-error)' }}>
            OVERALL COMPLIANCE STATUS: {snapshot.overall_result.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
            {allPass
              ? 'The pattern/model evaluated conforms to all tested statutory requirements of OIML Recommendation R 76-1:2006.'
              : 'The pattern/model evaluated did not conform to the statutory Maximum Permissible Error tolerances.'}
          </div>
        </div>

        {/* Section 1: Instrument Passport & Environmental Conditions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 36px', marginBottom: 28, fontSize: 12 }}>
          <div>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--c-secondary)', fontWeight: 700, borderBottom: '1px solid var(--c-border)', paddingBottom: 4, marginBottom: 8 }}>
              1. Instrument Under Test
            </h3>
            <ReportField label="Instrument Name" value={ins?.name} />
            <ReportField label="Manufacturer" value={ins?.manufacturer} />
            <ReportField label="Model / Type" value={ins?.model} />
            <ReportField label="Serial Number" value={ins?.serial_number} />
            <ReportField label="Accuracy Class" value={`Class ${ins?.accuracy_class}`} />
            <ReportField label="Maximum Capacity (Max)" value={`${fmt(ins?.max_capacity)} ${ins?.unit}`} />
            <ReportField label="Verification Interval (e)" value={`${fmt(ins?.verification_scale_interval)} ${ins?.unit}`} />
            <ReportField label="Actual Scale Interval (d)" value={`${fmt(ins?.actual_scale_interval)} ${ins?.unit}`} />
            <ReportField label="Minimum Capacity (Min)" value={ins?.min_capacity ? `${fmt(ins?.min_capacity)} ${ins?.unit}` : '—'} />
            <ReportField label="Scale Intervals (n)" value={ins?.number_of_scale_intervals?.toLocaleString()} />
          </div>

          <div>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--c-secondary)', fontWeight: 700, borderBottom: '1px solid var(--c-border)', paddingBottom: 4, marginBottom: 8 }}>
              2. Test Conditions & Standards
            </h3>
            <ReportField label="Testing Laboratory" value={lab?.name} />
            <ReportField label="Test Date" value={snapshot.test_date} />
            <ReportField label="Lead Test Engineer" value={snapshot.technician_name} />
            <ReportField label="Reviewing Metrologist" value={snapshot.reviewer_name || 'Pending'} />
            <ReportField
              label="Temperature Range"
              value={`${snapshot.environmental_conditions?.temperature_start || '—'} °C to ${snapshot.environmental_conditions?.temperature_end || '—'} °C`}
            />
            <ReportField
              label="Relative Humidity"
              value={`${snapshot.environmental_conditions?.humidity_start || '—'} % to ${snapshot.environmental_conditions?.humidity_end || '—'} %`}
            />
            <ReportField
              label="Atmospheric Pressure"
              value={`${snapshot.environmental_conditions?.atmospheric_pressure || '1013.2'} hPa`}
            />
            <ReportField label="Evaluation Status" value={snapshot.status.toUpperCase()} />
          </div>
        </div>

        {/* Section 2: Weighing Performance Test */}
        {tests?.weighing_tests?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--c-secondary)', fontWeight: 700, marginBottom: 6 }}>
              3. Weighing Performance Test (Clause A.4.4 — Errors of Indication)
            </h3>
            <table className="tbl" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Applied Load ({ins?.unit})</th>
                  <th>Indication (Inc)</th>
                  <th>Indication (Dec)</th>
                  <th>Error (Inc)</th>
                  <th>Error (Dec)</th>
                  <th>MPE (Table 3)</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {tests.weighing_tests.map((w: any, idx: number) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(w.load)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(w.indication_inc)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(w.indication_dec)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtSigned(w.error_inc)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtSigned(w.error_dec)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-muted)' }}>±{fmt(w.mpe)}</td>
                    <td>{w.pass ? <span className="result-cell-pass">PASS</span> : <span className="result-cell-fail">FAIL</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 3: Repeatability Test */}
        {tests?.repeatability_tests?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--c-secondary)', fontWeight: 700, marginBottom: 6 }}>
              4. Repeatability Test (Clause A.4.10)
            </h3>
            <table className="tbl" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Load ({ins?.unit})</th>
                  <th>Observed Readings</th>
                  <th>Std Dev (σ)</th>
                  <th>Measured Range</th>
                  <th>Allowed Limit</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {tests.repeatability_tests.map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.load)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{(r.readings || []).join(', ')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.std_dev)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.range)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-muted)' }}>≤{fmt(r.mpe_range)}</td>
                    <td>{r.pass ? <span className="result-cell-pass">PASS</span> : <span className="result-cell-fail">FAIL</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 4: Eccentricity Test */}
        {tests?.eccentricity_tests?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--c-secondary)', fontWeight: 700, marginBottom: 6 }}>
              5. Eccentric Loading / Corner Load Test (Clause A.4.7 — Load = 1/3 Max)
            </h3>
            <table className="tbl" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th>Test Load</th>
                  <th>Center Reference</th>
                  <th>Corner Position</th>
                  <th>Reading</th>
                  <th>Deviation vs Center</th>
                  <th>MPE Limit</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {tests.eccentricity_tests.map((ecc: any, idx: number) => (
                  <React.Fragment key={idx}>
                    <tr style={{ background: '#fafbfc' }}>
                      <td><strong>{fmt(ecc.test_load)} {ins?.unit}</strong></td>
                      <td><strong>{fmt(ecc.center_reading)}</strong></td>
                      <td>Center (Reference)</td>
                      <td>{fmt(ecc.center_reading)}</td>
                      <td>—</td>
                      <td rowSpan={ecc.positions.length + 1} style={{ verticalAlign: 'middle', fontFamily: 'var(--font-mono)', color: 'var(--c-text-muted)' }}>
                        ±{fmt(ecc.mpe)}
                      </td>
                      <td rowSpan={ecc.positions.length + 1} style={{ verticalAlign: 'middle' }}>
                        {ecc.pass ? <span className="result-cell-pass">PASS</span> : <span className="result-cell-fail">FAIL</span>}
                      </td>
                    </tr>
                    {ecc.positions.map((p: any, j: number) => (
                      <tr key={j}>
                        <td></td>
                        <td></td>
                        <td>{p.position}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(p.reading)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtSigned(p.error)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 5: Reviewer Remarks & Integrity Hash */}
        {snapshot.reviewer_comments && (
          <div style={{ marginBottom: 20, padding: 14, background: 'var(--c-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
            <strong>Metrologist Review Remarks:</strong> {snapshot.reviewer_comments}
          </div>
        )}

        {/* Data Integrity & Lock Footer */}
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--c-bg)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 36,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={13} color="var(--c-primary)" />
            <span>
              <strong>Cryptographic Integrity Hash:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{snapshot.data_hash}</code>
            </span>
          </div>
          <div style={{ color: 'var(--c-text-subtle)' }}>Generated {new Date(snapshot.generated_at).toLocaleString()}</div>
        </div>

        {/* Signatures Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, fontSize: 12, paddingTop: 10 }}>
          <div>
            <div style={{ borderBottom: '1px solid #1a2330', height: 40, marginBottom: 8 }} />
            <div>
              <strong>Tested By:</strong> {snapshot.technician_name}
            </div>
            <div style={{ color: 'var(--c-text-muted)', fontSize: 11 }}>Date: {snapshot.test_date}</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #1a2330', height: 40, marginBottom: 8 }} />
            <div>
              <strong>Approved By:</strong> {snapshot.reviewer_name || 'Authorized Metrologist Signature'}
            </div>
            <div style={{ color: 'var(--c-text-muted)', fontSize: 11 }}>Status: {snapshot.status.toUpperCase()}</div>
          </div>
        </div>
      </div>
      {node}
    </div>
  );
}

function ReportField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: 'var(--c-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}
