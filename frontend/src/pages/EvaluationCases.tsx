import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileCheck, Search, ArrowRight, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { fmt } from '../lib/oiml';
import { useAuth } from '../lib/authContext';

export default function EvaluationCases() {
  const { role } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await api.cases.list();
      setCases(data || []);
    } catch (err) {
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = cases.filter((c) => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchSearch =
      !search ||
      c.case_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.instrument && c.instrument.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.instrument && c.instrument.manufacturer.toLowerCase().includes(search.toLowerCase())) ||
      c.technician_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>OIML R 76 Type-Evaluation Cases</h2>
          <p>End-to-end evaluation lifecycle tracking from observation capture to approval & lock</p>
        </div>
        <Link to="/cases/new" className="btn btn-primary">
          <Plus size={18} /> Start New Evaluation
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'approved', label: 'Approved (Locked)' },
            { id: 'rejected', label: 'Rejected / Revision' },
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
          placeholder="Search case, instrument, technician..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <FileCheck className="empty-icon" />
          <h3>No evaluation cases found</h3>
          <p>{filter === 'all' ? 'Create your first OIML R 76 evaluation case.' : `No cases matching filter "${filter}".`}</p>
          <Link to="/cases/new" className="btn btn-primary">
            <Plus size={18} /> Start New Evaluation
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Case No. & Rev</th>
                <th>Instrument Under Test</th>
                <th>Accuracy Class</th>
                <th>Test Date</th>
                <th>Technician</th>
                <th>Reviewer</th>
                <th>Compliance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/reports/${c.id}`} className="link font-bold">
                      {c.case_number}
                    </Link>
                    <span className="badge badge-class ml-1.5 text-[10px]">
                      V{c.revision}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold">{c.instrument?.name || '—'}</div>
                    <div className="mt-0.5 text-xs text-subtle">
                      {c.instrument?.manufacturer} {c.instrument?.model}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-class">Class {c.instrument?.accuracy_class}</span>
                  </td>
                  <td className="text-[13px] text-muted">{c.test_date || '—'}</td>
                  <td className="text-[13px] text-muted">{c.technician_name || '—'}</td>
                  <td className="text-[13px] text-muted">{c.reviewer_name || '—'}</td>
                  <td>
                    {c.overall_result === 'pass' && <span className="badge badge-pass">PASS</span>}
                    {c.overall_result === 'fail' && <span className="badge badge-fail">FAIL</span>}
                    {c.overall_result === 'pending' && <span className="badge badge-pending">PENDING</span>}
                  </td>
                  <td>
                    {c.status === 'approved' && <span className="badge badge-completed">APPROVED</span>}
                    {c.status === 'under_review' && <span className="badge badge-draft">UNDER REVIEW</span>}
                    {c.status === 'rejected' && <span className="badge badge-fail">REJECTED</span>}
                    {c.status === 'in_progress' && <span className="badge badge-pending">IN PROGRESS</span>}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {c.status === 'in_progress' && (
                      <Link to={`/cases/${c.id}/execute`} className="btn btn-primary btn-sm mr-1.5">
                        Continue Testing
                      </Link>
                    )}
                    {c.status === 'under_review' && role === 'reviewer' && (
                      <Link to={`/review?case_id=${c.id}`} className="btn btn-primary btn-sm mr-1.5">
                        Review & Approve
                      </Link>
                    )}
                    <Link to={`/reports/${c.id}`} className="btn btn-outline btn-sm">
                      View Report <ArrowRight size={12} />
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
