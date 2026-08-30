import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Lock,
  RotateCcw,
  FileText,
  Camera,
  History,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { fmt, fmtSigned } from '../lib/oiml';
import { useToast } from '../lib/useToast';

export default function ReviewWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { show, node } = useToast();

  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(searchParams.get('case_id') || null);
  const [caseDetail, setCaseDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reviewer inputs
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const loadCases = async () => {
    try {
      const list = await api.cases.list();
      setCases(list || []);

      const targetId = selectedCaseId || (list.find((c: any) => c.status === 'under_review')?.id) || list[0]?.id;
      if (targetId) {
        setSelectedCaseId(targetId);
        const detail = await api.cases.get(targetId);
        setCaseDetail(detail);
      }
    } catch (err: any) {
      show('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [selectedCaseId]);

  const selectCase = async (id: string) => {
    setSelectedCaseId(id);
    setLoading(true);
    try {
      const detail = await api.cases.get(id);
      setCaseDetail(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCaseId) return;
    setActionLoading(true);
    try {
      const res = await api.reviews.approve(selectedCaseId, approvalComments);
      show(`✓ Case ${res.case.case_number} Approved and Locked with Hash: ${res.data_hash.slice(0, 16)}...`);
      loadCases();
    } catch (err: any) {
      show('Error approving: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCaseId || !rejectionReason.trim()) {
      show('Mandatory rejection reason required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.reviews.reject(selectedCaseId, rejectionReason);
      show('✕ Case rejected. Correction request recorded in audit trail.');
      setShowRejectModal(false);
      loadCases();
    } catch (err: any) {
      show('Error rejecting: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!selectedCaseId) return;
    setActionLoading(true);
    try {
      const newCase = await api.reviews.createRevision(selectedCaseId, correctionNotes);
      show(`✓ Revision V${newCase.revision} created! Opening test execution workspace...`);
      setShowRevisionModal(false);
      setTimeout(() => navigate(`/cases/${newCase.id}/execute`), 600);
    } catch (err: any) {
      show('Error creating revision: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !caseDetail) return <div className="spinner" />;

  const ins = caseDetail?.instrument;
  const testData = caseDetail?.test_execution;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reviewer & Metrologist Workbench</h2>
          <p>Technical verification of test observations, calculations, evidence, and approval locking</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left Side: Case Queue */}
        <div className="card" style={{ height: 'fit-content', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: 'var(--c-text-subtle)' }}>
            Evaluation Cases Queue ({cases.length})
          </div>
          <div>
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => selectCase(c.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--c-border)',
                  cursor: 'pointer',
                  background: selectedCaseId === c.id ? 'var(--c-primary-light)' : 'transparent',
                  borderLeft: selectedCaseId === c.id ? '4px solid var(--c-primary)' : '4px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.case_number}</span>
                  <span className="badge badge-class" style={{ fontSize: 10 }}>V{c.revision}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
                  {c.instrument?.name || 'Instrument'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--c-text-subtle)' }}>{c.test_date}</span>
                  <StatusPill status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Detailed Inspection & Actions */}
        {caseDetail ? (
          <div>
            {/* Header / Actions Card */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>
                      {caseDetail.case_number} — Revision V{caseDetail.revision}
                    </h3>
                    <StatusPill status={caseDetail.status} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 2 }}>
                    Instrument: <strong>{ins?.name}</strong> ({ins?.manufacturer} {ins?.model} — Class {ins?.accuracy_class}) · Tested by {caseDetail.technician_name} on {caseDetail.test_date}
                  </p>
                </div>

                {/* Reviewer Action Controls */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {caseDetail.status !== 'approved' && (
                    <>
                      <button className="btn btn-outline" style={{ color: 'var(--c-error)', borderColor: 'var(--c-error)' }} onClick={() => setShowRejectModal(true)}>
                        <XCircle size={16} /> Reject & Return
                      </button>
                      <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                        <Lock size={16} /> {actionLoading ? 'Locking...' : 'Approve & Lock Certificate'}
                      </button>
                    </>
                  )}
                  {caseDetail.status === 'rejected' && (
                    <button className="btn btn-outline" onClick={() => setShowRevisionModal(true)}>
                      <RotateCcw size={16} /> Create Revision (V{caseDetail.revision + 1})
                    </button>
                  )}
                  <Link to={`/reports/${caseDetail.id}`} className="btn btn-outline">
                    <FileText size={16} /> Full Report View
                  </Link>
                </div>
              </div>

              {/* Locked Hash Badge if Approved */}
              {caseDetail.status === 'approved' && caseDetail.data_hash && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--c-success-light)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--c-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={15} />
                  <span><strong>Locked & Verified:</strong> SHA-256 Immutable Audit Hash: <code style={{ fontFamily: 'var(--font-mono)' }}>{caseDetail.data_hash}</code></span>
                </div>
              )}
            </div>

            {/* Test Results Summary Inspection */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>A.4.4 Weighing Performance Test Observations</h4>
              <table className="tbl" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>#</th><th>Load</th><th>Indication (Inc)</th><th>Indication (Dec)</th><th>Error (Inc)</th><th>Error (Dec)</th><th>MPE</th><th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {(testData?.weighing_tests || []).map((w: any, idx: number) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(w.load)} {ins?.unit}</td>
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

            {/* Eccentricity Inspection */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>A.4.7 Eccentricity Corner Load Inspection</h4>
              <table className="tbl" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Load</th><th>Center Reference</th><th>Corner Deviations</th><th>Max Deviation</th><th>MPE</th><th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {(testData?.eccentricity_tests || []).map((ecc: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(ecc.test_load)} {ins?.unit}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(ecc.center_reading)}</td>
                      <td style={{ fontSize: 12 }}>
                        {(ecc.positions || []).map((p: any, j: number) => (
                          <div key={j}>
                            {p.position}: {fmt(p.reading)} ({fmtSigned(p.error)})
                          </div>
                        ))}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(ecc.max_error)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-muted)' }}>±{fmt(ecc.mpe)}</td>
                      <td>{ecc.pass ? <span className="result-cell-pass">PASS</span> : <span className="result-cell-fail">FAIL</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Evidence & Photographs */}
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={16} color="var(--c-primary)" />
                <span>Attached Test Evidence ({caseDetail.evidence?.length || 0} items)</span>
              </h4>
              {(!caseDetail.evidence || caseDetail.evidence.length === 0) ? (
                <div style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>No photo evidence attached.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {caseDetail.evidence.map((ev: any) => (
                    <div key={ev.id} style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img src={ev.file_url} alt={ev.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      <div style={{ padding: 10, fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{ev.title}</div>
                        <div style={{ color: 'var(--c-text-subtle)', fontSize: 11 }}>{ev.remarks}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card empty-state">Select a case to inspect.</div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-error)', marginBottom: 8 }}>
              Reject Case & Request Correction
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 14 }}>
              Specify the metrological non-conformity or missing observation requiring correction by the technician.
            </p>
            <textarea
              className="form-textarea"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Eccentricity corner load test failed on quadrant 3 (error exceeds MPE ±0.5 kg). Re-level platform and trim span..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Create Successor Revision (V{caseDetail?.revision + 1})
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 14 }}>
              Initiate a corrected test run preserving the complete audit history of Revision V{caseDetail?.revision}.
            </p>
            <textarea
              className="form-textarea"
              rows={3}
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="Notes on what was adjusted prior to this re-test..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowRevisionModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateRevision} disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Create Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {node}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === 'approved') return <span className="badge badge-pass">APPROVED</span>;
  if (status === 'rejected') return <span className="badge badge-fail">REJECTED</span>;
  if (status === 'under_review') return <span className="badge badge-draft">UNDER REVIEW</span>;
  return <span className="badge badge-pending">IN PROGRESS</span>;
}
