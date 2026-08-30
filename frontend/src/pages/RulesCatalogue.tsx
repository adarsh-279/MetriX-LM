import React, { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { api } from '../lib/api';

export default function RulesCatalogue() {
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.rules.list();
        setRulesets(data || []);
        if (data && data.length > 0) setSelectedId(data[0].id);
      } catch (err) {
        console.error('Error loading rulesets:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="spinner" />;

  const activeRuleset = rulesets.find((r) => r.id === selectedId) || rulesets[0];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Versioned OIML Rules Catalogue</h2>
          <p>Deterministic metrological rules and mathematical definitions per OIML R 76-1 & National Standards</p>
        </div>
      </div>

      <div className="mb-5 flex gap-3">
        {rulesets.map((r) => (
          <button
            key={r.id}
            className={`card card-pad flex-1 cursor-pointer text-left ${
              selectedId === r.id ? 'border-2 border-primary bg-primary-light' : 'border border-border bg-surface'
            }`}
            onClick={() => setSelectedId(r.id)}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold">{r.standard}</span>
              <span className="badge badge-class text-[10px]">Release {r.release_year}</span>
            </div>
            <div className="text-xs leading-snug text-muted">{r.title}</div>
            <div className="mt-2 text-[11px] font-semibold text-success">● Active Release · Effective {r.effective_date}</div>
          </button>
        ))}
      </div>

      {activeRuleset && (
        <div className="card card-pad">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <FlaskConical size={20} className="text-primary" />
            <h3 className="text-base font-bold">
              Standard Clauses & Calculation Formulas ({activeRuleset.rules?.length || 0} Defined Rules)
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            {(activeRuleset.rules || []).map((rule: any) => (
              <div key={rule.id} className="rounded-sm border border-border bg-page p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-class text-[11px]">Clause {rule.clause}</span>
                    <h4 className="text-[15px] font-bold">{rule.title}</h4>
                  </div>
                  <div className="text-[11px] text-subtle">ID: {rule.id}</div>
                </div>

                <p className="mb-2.5 text-[13px] leading-normal text-muted">{rule.description}</p>

                <div className="rounded-sm border border-border bg-white px-3 py-2 font-mono text-xs">
                  <strong>Formula:</strong> {rule.formula_summary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
