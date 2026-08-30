import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Search, Download, Printer, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { fmt } from '../lib/oiml';

export default function Reports() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.cases.list();
        setCases(data || []);
      } catch (err) {
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = cases.filter((c) => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchSearch =
      !search ||
      c.case_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.instrument && c.instrument.name.toLowerCase().includes(search.toLowerCase())) ||
      c.technician_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Standardized Test Reports Repository</h2>
          <p>Search, inspect, export CSV, and print OIML R 76-2 type-evaluation certificates</p>
        </div>
        <Link to="/cases/new" className="btn btn-primary">
          <Plus size={18} /> New Evaluation Run
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'approved', label: 'Approved (Issued)' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-sm ${filter === tab.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          className="form-input max-w-[280px]"
          placeholder="Search by report no, instrument..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <FileText className="empty-icon" />
          <h3>No reports found</h3>
          <p>Generate your first OIML R 76 compliance test report.</p>
          <Link to="/cases/new" className="btn btn-primary">
            <Plus size={18} /> New Test Report
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Report No.</th>
                <th>Instrument Under Test</th>
                <th>Class</th>
                <th>Max / Scale (e)</th>
                <th>Test Date</th>
                <th>Compliance</th>
                <th>Status</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/reports/${r.id}`} className="link font-bold">
                      OIML-R76-REP-{r.case_number.replace('CASE-', '')}-V{r.revision}
                    </Link>
                  </td>
                  <td>{r.instrument?.name || '—'}</td>
                  <td>
                    <span className="badge badge-class">Class {r.instrument?.accuracy_class}</span>
                  </td>
                  <td className="font-mono text-[13px] text-muted">
                    {r.instrument ? `${fmt(r.instrument.max_capacity)} ${r.instrument.unit} / ${fmt(r.instrument.verification_scale_interval)} ${r.instrument.unit}` : '—'}
                  </td>
                  <td className="text-muted">{r.test_date || '—'}</td>
                  <td>
                    {r.overall_result === 'pass' && <span className="badge badge-pass">PASS</span>}
                    {r.overall_result === 'fail' && <span className="badge badge-fail">FAIL</span>}
                    {r.overall_result === 'pending' && <span className="badge badge-pending">PENDING</span>}
                  </td>
                  <td>
                    {r.status === 'approved' && <span className="badge badge-completed">APPROVED (LOCKED)</span>}
                    {r.status === 'under_review' && <span className="badge badge-draft">UNDER REVIEW</span>}
                    {r.status === 'rejected' && <span className="badge badge-fail">REJECTED</span>}
                    {r.status === 'in_progress' && <span className="badge badge-pending">IN PROGRESS</span>}
                  </td>
                  <td>
                    <Link to={`/reports/${r.id}`} className="btn btn-outline btn-sm inline-flex items-center gap-1">
                      <FileText size={13} /> View Certificate <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
