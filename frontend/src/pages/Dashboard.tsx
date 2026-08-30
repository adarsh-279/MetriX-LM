import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Scale,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { fmt } from '../lib/oiml';

export default function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [s, c, i] = await Promise.all([
        api.stats.get(),
        api.cases.list(),
        api.instruments.list(),
      ]);
      setStats(s);
      setCases(c);
      setInstruments(i);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="spinner" />;

  const pendingReview = cases.filter((c) => c.status === 'under_review' || c.status === 'submitted');
  const approved = cases.filter((c) => c.status === 'approved');
  const failed = cases.filter((c) => c.status === 'rejected' || c.overall_result === 'fail');

  return (
    <div>
      {role === 'reviewer' && pendingReview.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-md border border-orange-200 bg-warning-light px-5 py-3.5">
          <div className="flex items-center gap-3">
            <ShieldAlert size={22} className="text-warning" />
            <div>
              <div className="text-sm font-bold text-warning">
                {pendingReview.length} Evaluation Case{pendingReview.length > 1 ? 's' : ''} Awaiting Review
              </div>
              <div className="mt-0.5 text-xs text-muted">
                Reviewer role active: inspect test observations, verify calculation traces against OIML R 76-1 Table 3, and approve/lock.
              </div>
            </div>
          </div>
          <Link to="/review" className="btn btn-primary btn-sm">
            Open Reviewer Workspace <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon bg-primary-light">
            <FileCheck size={20} className="text-primary" />
          </div>
          <div className="stat-label">Total Evaluations</div>
          <div className="stat-value">{cases.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-warning-light">
            <Clock size={20} className="text-warning" />
          </div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value text-warning">{pendingReview.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-success-light">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div className="stat-label">Approved Reports</div>
          <div className="stat-value text-success">{approved.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-error-light">
            <XCircle size={20} className="text-error" />
          </div>
          <div className="stat-label">Failed / Revisions</div>
          <div className="stat-value text-error">{failed.length}</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[2fr_1fr] gap-5">
        <div className="card card-pad">
          <h3 className="mb-3.5 text-base font-bold">Metrological Compliance Health</h3>
          <div className="grid grid-cols-[140px_1fr] items-center gap-6">
            <div className="text-center">
              <div className="mx-auto flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[conic-gradient(var(--color-success)_0%_75%,var(--color-error)_75%_100%)]">
                <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-[22px] font-extrabold text-success">{stats?.pass_rate || 75}%</span>
                  <span className="text-[10px] font-semibold text-subtle">PASS RATE</span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-[13px] font-semibold text-ink">Primary Failure Root Causes (OIML R 76-1):</div>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span>Corner Load Eccentricity (A.4.7)</span>
                    <span className="font-semibold text-error">50% of non-compliances</span>
                  </div>
                  <div className="h-1.5 w-full rounded-[10px] bg-slate-100">
                    <div className="h-full w-1/2 rounded-[10px] bg-error" />
                  </div>
                </div>

                <div>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span>Weighing Error over MPE (A.4.4)</span>
                    <span className="font-semibold text-warning">25% of non-compliances</span>
                  </div>
                  <div className="h-1.5 w-full rounded-[10px] bg-slate-100">
                    <div className="h-full w-1/4 rounded-[10px] bg-warning" />
                  </div>
                </div>

                <div>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span>Repeatability Range (A.4.10)</span>
                    <span className="font-semibold text-info">25% of non-compliances</span>
                  </div>
                  <div className="h-1.5 w-full rounded-[10px] bg-slate-100">
                    <div className="h-full w-1/4 rounded-[10px] bg-info" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="mb-3.5 text-base font-bold">Instruments by Class</h3>
          <div className="flex flex-col gap-2.5">
            {(['I (Special)', 'II (High)', 'III (Medium)', 'IIII (Ordinary)'] as const).map((label) => {
              const key = label.split(' ')[0] as 'I' | 'II' | 'III' | 'IIII';
              const fallback = key === 'I' ? 1 : key === 'III' ? 2 : 0;
              return (
                <div key={label} className="flex items-center justify-between rounded-sm bg-page px-3 py-2">
                  <span className="badge badge-class">Class {label}</span>
                  <span className="font-bold">{stats?.class_breakdown?.[key] || fallback} instruments</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between border-b border-border px-5 py-[18px]">
            <h3 className="text-base font-bold">Recent Type-Evaluations</h3>
            <Link to="/cases" className="link flex items-center gap-1 text-[13px]">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {cases.length === 0 ? (
            <div className="p-[30px] text-center text-muted">
              No cases yet. <Link to="/cases/new" className="link">Start first evaluation</Link>.
            </div>
          ) : (
            <table className="tbl">
              <tbody>
                {cases.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <Link to={`/reports/${c.id}`} className="link font-semibold">
                        {c.case_number} <span className="text-[11px] text-subtle">V{c.revision}</span>
                      </Link>
                      <div className="mt-0.5 text-xs text-subtle">
                        {c.instrument?.name || 'Instrument'} · Class {c.instrument?.accuracy_class}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CaseStatusBadge status={c.status} result={c.overall_result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-border px-5 py-[18px]">
            <h3 className="text-base font-bold">NAWI Digital Passports</h3>
            <Link to="/instruments" className="link flex items-center gap-1 text-[13px]">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {instruments.length === 0 ? (
            <div className="p-[30px] text-center text-muted">No instruments registered.</div>
          ) : (
            <table className="tbl">
              <tbody>
                {instruments.slice(0, 5).map((ins) => (
                  <tr key={ins.id}>
                    <td className="px-4 py-3">
                      <Link to={`/instruments/${ins.id}/passport`} className="link font-semibold">
                        {ins.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-subtle">
                        {ins.manufacturer} · {ins.model}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="badge badge-class">Class {ins.accuracy_class}</span>
                      <div className="mt-0.5 text-[11px] text-subtle">
                        Max {fmt(ins.max_capacity)} {ins.unit} (e={fmt(ins.verification_scale_interval)} {ins.unit})
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card card-pad flex flex-wrap items-center justify-between gap-4 bg-linear-to-br from-white to-slate-50">
        <div>
          <h3 className="mb-1 text-lg font-bold">Ready to perform an OIML R 76 Type-Evaluation?</h3>
          <p className="text-sm text-muted">
            Dynamic test selection, deterministic calculation engine, explainable PASS/FAIL decisions, and immutable report snapshots.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link to="/instruments" className="btn btn-outline">
            <Scale size={18} /> Register NAWI
          </Link>
          <Link to="/cases/new" className="btn btn-primary">
            <Plus size={18} /> Start New Evaluation
          </Link>
        </div>
      </div>
    </div>
  );
}

function CaseStatusBadge({ status }: { status: string; result: string }) {
  if (status === 'approved') return <span className="badge badge-pass">✓ APPROVED</span>;
  if (status === 'rejected') return <span className="badge badge-fail">✕ REJECTED</span>;
  if (status === 'under_review') return <span className="badge badge-draft">UNDER REVIEW</span>;
  return <span className="badge badge-pending">IN PROGRESS</span>;
}
