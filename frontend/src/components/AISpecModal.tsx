import React, { useState } from 'react';
import { X, Sparkles, Check, FileText } from 'lucide-react';
import { api } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (extracted: any) => void;
}

const SAMPLE_SPECS = [
  {
    label: 'Mettler Toledo Bench Scale Spec',
    text: `Manufacturer: Mettler Toledo AG
Model: IND560 Industrial Platform
Serial: SN-MT-2026-8801
Accuracy Class: Class III (Medium)
Max Capacity: 30 kg
Verification Scale Interval (e): 0.01 kg (10 g)
Actual Scale Interval (d): 0.01 kg
Min Capacity: 0.2 kg
Maximum Tare: 10 kg
Display: Backlit Graphic LCD
Load Receptor: 400x400mm Stainless Platform`,
  },
  {
    label: 'Sartorius Analytical Balance Spec',
    text: `Make: Sartorius Metrology GmbH
Model: Quintix 224-1S Analytical
Serial No: SAR-QUINT-2026
Accuracy Class: Class I (Special)
Capacity (Max): 220 g
Readability (d): 0.0001 g
Scale Interval (e): 0.001 g (1 mg)
Min Capacity: 0.01 g
Tare Range: 220 g`,
  },
];

export default function AISpecModal({ isOpen, onClose, onApply }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.ai.extractSpec(text);
      setExtracted(res);
    } catch (err: any) {
      alert('Error in AI extraction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (extracted) {
      onApply(extracted);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-linear-to-br from-primary to-secondary px-[22px] py-[18px] text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Sparkles size={18} className="text-yellow-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">AI Specification Extractor</h3>
              <p className="text-xs opacity-80">Extract NAWI parameters automatically from datasheets or catalog text</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer border-0 bg-transparent text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-[22px]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">Load Sample Datasheet:</span>
            {SAMPLE_SPECS.map((s, idx) => (
              <button
                key={idx}
                className="btn btn-outline btn-sm px-2.5 py-1 text-[11px]"
                onClick={() => {
                  setText(s.text);
                  setExtracted(null);
                }}
              >
                <FileText size={12} /> {s.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Raw Datasheet / Specification Text</label>
            <textarea
              className="form-textarea font-mono text-[13px]"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste manufacturer technical specification text, brochure details, or OCR text here..."
            />
          </div>

          <div className="mb-4 flex justify-end">
            <button className="btn btn-primary" onClick={handleExtract} disabled={loading || !text.trim()}>
              <Sparkles size={16} /> {loading ? 'Extracting Parameters...' : 'Extract Parameters'}
            </button>
          </div>

          {extracted && (
            <div className="rounded-sm border border-border bg-page p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-primary">
                  Extracted NAWI Parameters ({extracted.extracted_fields.length} fields detected)
                </h4>
                <span className="rounded-full bg-success-light px-2 py-0.5 text-[11px] font-semibold text-success">
                  {Math.round(extracted.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                <div>
                  <span className="text-muted">Manufacturer:</span> <strong>{extracted.manufacturer || '—'}</strong>
                </div>
                <div>
                  <span className="text-muted">Model:</span> <strong>{extracted.model || '—'}</strong>
                </div>
                <div>
                  <span className="text-muted">Accuracy Class:</span>{' '}
                  <span className="badge badge-class">Class {extracted.accuracy_class || '—'}</span>
                </div>
                <div>
                  <span className="text-muted">Serial Number:</span>{' '}
                  <code className="font-mono">{extracted.serial_number || '—'}</code>
                </div>
                <div>
                  <span className="text-muted">Max Capacity:</span>{' '}
                  <strong>
                    {extracted.max_capacity} {extracted.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Verification Interval (e):</span>{' '}
                  <strong>
                    {extracted.verification_scale_interval} {extracted.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-muted">Min Capacity:</span>{' '}
                  <strong>{extracted.min_capacity ? `${extracted.min_capacity} ${extracted.unit}` : '—'}</strong>
                </div>
                <div>
                  <span className="text-muted">Tare Max:</span>{' '}
                  <strong>{extracted.tare_max ? `${extracted.tare_max} ${extracted.unit}` : '—'}</strong>
                </div>
              </div>

              <div className="mt-3.5 rounded-sm bg-warning-light p-2.5 text-xs text-warning">
                ⚠️ <strong>Metrological Guardrail:</strong> AI assistance is for initial data entry acceleration. The
                technician must verify all parameters against the physical instrument rating plate before saving.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-[22px] py-3.5">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          {extracted && (
            <button className="btn btn-primary" onClick={handleApply}>
              <Check size={16} /> Apply Extracted Parameters to Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
