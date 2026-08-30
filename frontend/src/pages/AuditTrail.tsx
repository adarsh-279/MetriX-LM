import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AuditTrail() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.audit.list();
        setEvents(data || []);
      } catch (err) {
        console.error('Error loading audit trail:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>System Audit Trail & Traceability Log</h2>
          <p>Immutable append-only record of all observation edits, evidence attachments, approvals, and revisions</p>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor & Role</th>
              <th>Action</th>
              <th>Target Entity</th>
              <th>Before / After Details</th>
              <th>Reason / Justification</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td className="whitespace-nowrap font-mono text-xs text-muted">
                  {new Date(ev.timestamp).toLocaleString()}
                </td>
                <td>
                  <div className="text-[13px] font-semibold">{ev.actor_name}</div>
                  <span className="badge badge-class mt-0.5 text-[10px]">{ev.actor_role}</span>
                </td>
                <td>
                  <code className="text-xs font-semibold text-primary">{ev.action}</code>
                </td>
                <td>
                  <div className="text-xs">{ev.entity_type}</div>
                  <div className="font-mono text-[11px] text-subtle">ID: {ev.entity_id?.slice(0, 12)}...</div>
                </td>
                <td className="max-w-[260px] text-xs">
                  {ev.before_value && <div className="text-error line-through">Old: {ev.before_value}</div>}
                  {ev.after_value && <div className="font-medium text-success">New: {ev.after_value}</div>}
                  {!ev.before_value && !ev.after_value && '—'}
                </td>
                <td className="text-xs text-muted">{ev.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
