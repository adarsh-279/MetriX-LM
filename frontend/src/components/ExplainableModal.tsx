import React from 'react';
import { X, CheckCircle2, XCircle, Info, BookOpen, Calculator } from 'lucide-react';
import { fmtSigned } from '../lib/oiml';

export interface ExplainableData {
  testName: string;
  load: number | string;
  unit: string;
  indication?: number | string;
  error?: number | string;
  mpe: number | string;
  pass: boolean;
  clauseRef?: string;
  excess?: number | string;
  explanation?: string;
  formula?: string;
  accuracyClass?: string;
}

interface Props {
  data: ExplainableData | null;
  onClose: () => void;
}

export default function ExplainableModal({ data, onClose }: Props) {
  if (!data) return null;

  return (
    <div className="modal-overlay backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="card w-full max-w-[580px] overflow-hidden bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between border-b border-border px-[22px] py-[18px] ${
            data.pass ? 'bg-success-light' : 'bg-error-light'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {data.pass ? (
              <CheckCircle2 size={22} className="text-success" />
            ) : (
              <XCircle size={22} className="text-error" />
            )}
            <div>
              <h3 className={`text-base font-bold ${data.pass ? 'text-success' : 'text-error'}`}>
                Metrological Decision Trace — {data.pass ? 'PASS' : 'FAIL'}
              </h3>
              <div className="mt-px text-xs text-muted">
                {data.testName} (Load: {data.load} {data.unit})
              </div>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer border-0 bg-transparent p-1 text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 text-sm">
          <div className="mb-5 grid grid-cols-3 gap-3 rounded-sm border border-border bg-page p-4 text-center">
            <div>
              <div className="text-[11px] font-semibold text-subtle uppercase">Observed Error</div>
              <div className={`mt-1 font-mono text-xl font-bold ${data.pass ? 'text-ink' : 'text-error'}`}>
                {data.error !== undefined ? fmtSigned(Number(data.error)) : '—'} {data.unit}
              </div>
            </div>

            <div className="border-x border-border">
              <div className="text-[11px] font-semibold text-subtle uppercase">Permissible MPE</div>
              <div className="mt-1 font-mono text-xl font-bold text-primary">
                ±{data.mpe} {data.unit}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-subtle uppercase">Outcome</div>
              <div className="mt-1">
                <span className={`badge px-3 py-1 text-sm ${data.pass ? 'badge-pass' : 'badge-fail'}`}>
                  {data.pass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-[18px]">
            <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <Calculator size={15} className="text-primary" />
              <span>Calculation & Verification Steps</span>
            </h4>
            <div className="rounded-sm border border-border bg-surface p-3.5 text-[13px] leading-relaxed">
              <div>
                <strong>1. Formula:</strong>{' '}
                <code>{data.formula || 'Error of Indication E = Indication (I) - Applied Load (L)'}</code>
              </div>
              {data.indication !== undefined && (
                <div>
                  <strong>2. Evaluation:</strong>{' '}
                  <span className="font-mono">
                    E = {data.indication} {data.unit} - {data.load} {data.unit} = {fmtSigned(Number(data.error))} {data.unit}
                  </span>
                </div>
              )}
              <div>
                <strong>3. Regulatory Limit:</strong>{' '}
                <span className="font-mono">
                  |E| = {Math.abs(Number(data.error || 0))} {data.unit} {data.pass ? '≤' : '>'} MPE = {data.mpe} {data.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-[18px]">
            <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <BookOpen size={15} className="text-accent" />
              <span>Regulatory Standard Reference</span>
            </h4>
            <div className="rounded-sm border border-orange-200 bg-accent-light px-3.5 py-2.5 text-xs text-orange-900">
              <strong>Clause / Standard:</strong> {data.clauseRef || 'OIML R 76-1:2006 Table 3 — Maximum Permissible Errors for Initial Verification'}.
              {data.accuracyClass && ` (Evaluated under Accuracy Class ${data.accuracyClass} limits).`}
            </div>
          </div>

          {data.explanation && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-bold text-ink">
                <Info size={15} className="text-info" />
                <span>Deterministic Compliance Reasoning</span>
              </h4>
              <p className="rounded-sm bg-page p-3 text-[13px] leading-relaxed text-muted">{data.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-[22px] py-3.5">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
