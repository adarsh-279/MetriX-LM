import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  ArrowLeft,
  Info,
  Camera,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  Upload,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  getMPEForLoad,
  evaluateWeighingPoint,
  evaluateRepeatability,
  evaluateEccentricity,
  evaluateZeroTare,
  evaluateDiscrimination,
  computeOverallCompliance,
  fmt,
  fmtSigned,
  type AccuracyClass,
} from '../lib/oiml';
import { useToast } from '../lib/useToast';
import ExplainableModal, { type ExplainableData } from '../components/ExplainableModal';

const STEPS = [
  'Environmental & Setup',
  'Weighing Performance (A.4.4)',
  'Repeatability (A.4.10)',
  'Eccentricity (A.4.7)',
  'Zero, Tare & Discrimination',
  'Evidence & Submit',
];

export default function CaseExecution() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { show, node } = useToast();

  const [step, setStep] = useState(0);
  const [caseItem, setCaseItem] = useState<any | null>(null);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal for explainable decision
  const [explainData, setExplainData] = useState<ExplainableData | null>(null);

  // Setup Form State
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(searchParams.get('instrument_id') || '');
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [tempStart, setTempStart] = useState('22.0');
  const [tempEnd, setTempEnd] = useState('22.5');
  const [humStart, setHumStart] = useState('50.0');
  const [humEnd, setHumEnd] = useState('52.0');
  const [pressure, setPressure] = useState('1013.2');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [ruleRelease, setRuleRelease] = useState('OIML-R76-2006');

  // Test Execution Rows
  const [weighingRows, setWeighingRows] = useState<any[]>([
    { load: '', indication_inc: '', indication_dec: '' },
  ]);
  const [repeatRows, setRepeatRows] = useState<any[]>([
    { load: '', readings: ['', '', '', '', ''] },
  ]);
  const [eccRows, setEccRows] = useState<any[]>([
    { center_reading: '', positions: ['', '', '', ''] },
  ]);
  const [tareRows, setTareRows] = useState<any[]>([
    { tare_load: '', test_load: '', net_indication: '' },
  ]);
  const [discRows, setDiscRows] = useState<any[]>([
    { test_load: '', reading_before: '', reading_after: '' },
  ]);

  // Evidence state
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceCategory, setNewEvidenceCategory] = useState('test_setup');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [newEvidenceRemarks, setNewEvidenceRemarks] = useState('');

  const loadData = async () => {
    try {
      const [insData, eqData] = await Promise.all([
        api.instruments.list(),
        api.equipment.list(),
      ]);
      setInstruments(insData || []);
      setEquipmentList(eqData || []);

      if (id) {
        // Editing existing case
        const c = await api.cases.get(id);
        setCaseItem(c);
        setSelectedInstrumentId(c.instrument_id);
        setTestDate(c.test_date || new Date().toISOString().slice(0, 10));
        if (c.environmental_conditions) {
          setTempStart(String(c.environmental_conditions.temperature_start || '22.0'));
          setTempEnd(String(c.environmental_conditions.temperature_end || '22.5'));
          setHumStart(String(c.environmental_conditions.humidity_start || '50.0'));
          setHumEnd(String(c.environmental_conditions.humidity_end || '52.0'));
          setPressure(String(c.environmental_conditions.atmospheric_pressure || '1013.2'));
        }
        if (c.equipment_used_ids) setSelectedEquipment(c.equipment_used_ids);

        // Load existing test executions
        if (c.test_execution) {
          const t = c.test_execution;
          if (t.weighing_tests?.length) setWeighingRows(t.weighing_tests);
          if (t.repeatability_tests?.length) setRepeatRows(t.repeatability_tests);
          if (t.eccentricity_tests?.length) {
            setEccRows(
              t.eccentricity_tests.map((ecc: any) => ({
                center_reading: ecc.center_reading !== undefined ? String(ecc.center_reading) : '',
                positions: (ecc.positions || []).map((p: any) => (p.reading !== undefined ? String(p.reading) : '')),
              }))
            );
          }
          if (t.zero_tare_tests?.length) setTareRows(t.zero_tare_tests);
          if (t.discrimination_tests?.length) setDiscRows(t.discrimination_tests);
        }

        if (c.evidence) setEvidenceList(c.evidence);
      } else if (insData && insData.length > 0 && !selectedInstrumentId) {
        setSelectedInstrumentId(insData[0].id);
      }
    } catch (err: any) {
      show('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const instrument = instruments.find((i) => i.id === selectedInstrumentId);
  const cls = (instrument?.accuracy_class || 'III') as AccuracyClass;
  const e = instrument?.verification_scale_interval || 1;
  const max = instrument?.max_capacity || 0;
  const unit = instrument?.unit || 'kg';

  // Auto-generate standard OIML load test points
  const autoGenerateLoads = () => {
    if (!max || !e) return;
    const minCap = instrument?.min_capacity || 20 * e;
    // OIML Recommended points: Min, 500e, 1000e, 2000e, 50% Max, Max
    const points = [
      minCap,
      Math.min(500 * e, max * 0.25),
      Math.min(1000 * e, max * 0.5),
      Math.min(2000 * e, max * 0.75),
      max,
    ].map((val) => ({
      load: String(val),
      indication_inc: '',
      indication_dec: '',
    }));
    setWeighingRows(points);
    show('✨ Auto-generated OIML R 76-1 Table 3 test points');
  };

  // Evaluate dynamic weighing rows
  const evaluatedWeighing = weighingRows.map((r) => {
    const load = parseFloat(r.load);
    const inc = r.indication_inc !== undefined && r.indication_inc !== '' ? parseFloat(r.indication_inc) : undefined;
    const dec = r.indication_dec !== undefined && r.indication_dec !== '' ? parseFloat(r.indication_dec) : undefined;
    if (isNaN(load)) return { ...r, mpe: 0, pass: true };
    return evaluateWeighingPoint(load, e, cls, inc, dec);
  });

  // Evaluate dynamic repeatability rows
  const evaluatedRepeat = repeatRows.map((r) => {
    const load = parseFloat(r.load);
    const readings = (r.readings || []).map((v: any) => parseFloat(v)).filter((v: any) => !isNaN(v));
    if (isNaN(load) || readings.length < 2) return { ...r, mpe_range: e <= 0.2 ? 0.25 * e : 0.5 * e, pass: true };
    return evaluateRepeatability(load, readings, e);
  });

  // Evaluate dynamic eccentricity rows
  const evaluatedEcc = eccRows.map((r) => {
    const testLoad = max ? max / 3 : 10;
    const center = r.center_reading !== undefined && r.center_reading !== '' ? parseFloat(r.center_reading) : undefined;
    const posInputs = (r.positions || []).map((val: any, j: number) => ({
      position: ['Front-Left', 'Back-Left', 'Back-Right', 'Front-Right'][j],
      reading: val !== undefined && val !== '' ? parseFloat(val) : undefined,
    }));
    return evaluateEccentricity(testLoad, center, posInputs, e, cls);
  });

  // Evaluate dynamic zero/tare rows
  const evaluatedTare = tareRows.map((r) => {
    const tareLoad = parseFloat(r.tare_load || 0);
    const testLoad = parseFloat(r.test_load || 0);
    const net = r.net_indication !== undefined && r.net_indication !== '' ? parseFloat(r.net_indication) : undefined;
    return evaluateZeroTare(tareLoad, testLoad, net, e, cls);
  });

  // Evaluate dynamic discrimination rows
  const evaluatedDisc = discRows.map((r) => {
    const testLoad = parseFloat(r.test_load || 0);
    const before = r.reading_before !== undefined && r.reading_before !== '' ? parseFloat(r.reading_before) : undefined;
    const after = r.reading_after !== undefined && r.reading_after !== '' ? parseFloat(r.reading_after) : undefined;
    return evaluateDiscrimination(testLoad, before, after);
  });

  // Collect overall pass results
  const allTestPasses: { pass: boolean }[] = [];
  evaluatedWeighing.forEach((w) => {
    if (w.indication_inc !== undefined || w.indication_dec !== undefined) allTestPasses.push({ pass: w.pass });
  });
  evaluatedRepeat.forEach((r) => {
    if (r.readings && r.readings.length > 1) allTestPasses.push({ pass: r.pass });
  });
  evaluatedEcc.forEach((ecc) => {
    if (ecc.center_reading !== undefined && ecc.positions.some((p) => p.reading !== undefined))
      allTestPasses.push({ pass: ecc.pass });
  });
  evaluatedTare.forEach((t) => {
    if (t.net_indication !== undefined) allTestPasses.push({ pass: t.pass });
  });
  evaluatedDisc.forEach((d) => {
    if (d.reading_before !== undefined && d.reading_after !== undefined) allTestPasses.push({ pass: d.pass });
  });

  const overallOutcome = computeOverallCompliance(allTestPasses);

  // Save / Submit Handler
  const handleSaveObservations = async (andSubmit = false) => {
    if (!selectedInstrumentId) {
      show('Please select an instrument.');
      return;
    }

    setSaving(true);
    try {
      let activeCaseId = id;

      // If creating new case
      if (!activeCaseId) {
        const created = await api.cases.create({
          instrument_id: selectedInstrumentId,
          test_date: testDate,
          temperature_start: tempStart,
          temperature_end: tempEnd,
          humidity_start: humStart,
          humidity_end: humEnd,
          atmospheric_pressure: pressure,
          equipment_used_ids: selectedEquipment,
          rule_release_id: ruleRelease,
        });
        activeCaseId = created.id;
      }

      // Save observations payload
      const payload = {
        weighing_tests: evaluatedWeighing,
        repeatability_tests: evaluatedRepeat,
        eccentricity_tests: evaluatedEcc,
        zero_tare_tests: evaluatedTare,
        discrimination_tests: evaluatedDisc,
      };

      await api.cases.saveObservations(activeCaseId!, payload);

      if (andSubmit) {
        await api.cases.submit(activeCaseId!);
        show('🚀 Case submitted for Reviewer verification!');
        setTimeout(() => navigate(`/reports/${activeCaseId}`), 700);
      } else {
        show('✓ Observations and compliance calculations saved');
        if (!id) navigate(`/cases/${activeCaseId}/execute`);
      }
    } catch (err: any) {
      show('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!newEvidenceTitle || !newEvidenceUrl) {
      show('Title and Photo URL required.');
      return;
    }
    try {
      const activeCaseId = id || caseItem?.id;
      if (!activeCaseId) {
        show('Save case setup first.');
        return;
      }
      const item = await api.evidence.add({
        case_id: activeCaseId,
        category: newEvidenceCategory,
        title: newEvidenceTitle,
        file_url: newEvidenceUrl,
        remarks: newEvidenceRemarks,
      });
      setEvidenceList([...evidenceList, item]);
      setNewEvidenceTitle('');
      setNewEvidenceUrl('');
      setNewEvidenceRemarks('');
      show('Photo evidence attached');
    } catch (err: any) {
      show('Error attaching evidence: ' + err.message);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/cases" className="link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Back to Cases
        </Link>
      </div>

      {/* Step Wizard Header */}
      <div className="wizard-header">
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
              style={{ cursor: 'pointer' }}
            >
              <div className="wizard-step-num">{i < step ? <Check size={16} /> : i + 1}</div>
              <div className="wizard-step-label">{label}</div>
            </div>
            {i < STEPS.length - 1 && <div className={`wizard-divider ${i < step ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      {/* Active Instrument Context Bar */}
      {instrument && (
        <div
          className="tag-row"
          style={{
            marginBottom: 18,
            padding: '10px 14px',
            background: 'var(--c-primary-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(13, 110, 110, 0.2)',
          }}
        >
          <span className="info-chip">
            <strong>{instrument.name}</strong> ({instrument.manufacturer})
          </span>
          <span className="info-chip">
            Accuracy Class <strong>Class {instrument.accuracy_class}</strong>
          </span>
          <span className="info-chip">
            Max <strong>{fmt(instrument.max_capacity)} {unit}</strong>
          </span>
          <span className="info-chip">
            e = <strong>{fmt(instrument.verification_scale_interval)} {unit}</strong>
          </span>
          <span className="info-chip">
            n = <strong>{instrument.number_of_scale_intervals?.toLocaleString()}</strong>
          </span>
          <span className="info-chip" style={{ marginLeft: 'auto', background: '#ffffff' }}>
            Ruleset: <strong>{ruleRelease}</strong>
          </span>
        </div>
      )}

      <div className="card card-pad">
        {/* Step 0: Environmental Conditions & Setup */}
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Step 1: Instrument & Environmental Conditions (Clause A.4.1)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 18 }}>
              Configure instrument under test, laboratory environmental conditions, and traceable calibration standards.
            </p>

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Weighing Instrument Under Test (NAWI) *</label>
                <select
                  className="form-select"
                  value={selectedInstrumentId}
                  onChange={(e) => setSelectedInstrumentId(e.target.value)}
                  disabled={!!id}
                >
                  <option value="">Select an instrument...</option>
                  {instruments.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.name} ({ins.manufacturer} {ins.model}) — Class {ins.accuracy_class} (Max {fmt(ins.max_capacity)} {ins.unit}, e={fmt(ins.verification_scale_interval)} {ins.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Test Date</label>
                <input className="form-input" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Standard Ruleset</label>
                <select className="form-select" value={ruleRelease} onChange={(e) => setRuleRelease(e.target.value)}>
                  <option value="OIML-R76-2006">OIML R 76-1:2006 (International)</option>
                  <option value="LM-RULES-2011">Legal Metrology Rules 2011 (India)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Temperature Start (°C)</label>
                <input className="form-input input-numeric" value={tempStart} onChange={(e) => setTempStart(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Temperature End (°C)</label>
                <input className="form-input input-numeric" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Relative Humidity Start (%)</label>
                <input className="form-input input-numeric" value={humStart} onChange={(e) => setHumStart(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Relative Humidity End (%)</label>
                <input className="form-input input-numeric" value={humEnd} onChange={(e) => setHumEnd(e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Atmospheric Pressure (hPa)</label>
                <input className="form-input input-numeric" value={pressure} onChange={(e) => setPressure(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Weighing Performance Test */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                  Test A: Weighing Performance Test (Clause A.4.4)
                </h3>
                <p style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                  Error of indication for increasing and decreasing test loads. Error |E| must be ≤ MPE (OIML R 76-1 Table 3).
                </p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={autoGenerateLoads}>
                <Sparkles size={14} color="var(--c-accent)" /> Auto-Fill Standard Load Points
              </button>
            </div>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Applied Load ({unit})</th>
                  <th>Indication (Inc)</th>
                  <th>Indication (Dec)</th>
                  <th>Error (Inc)</th>
                  <th>Error (Dec)</th>
                  <th>MPE (Table 3)</th>
                  <th>Status</th>
                  <th>Explain</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {weighingRows.map((row, i) => {
                  const ev = evaluatedWeighing[i] || {};
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.load}
                          onChange={(e) => updateWeighingRow(i, 'load', e.target.value)}
                          placeholder="e.g. 10"
                          style={{ width: 95 }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.indication_inc}
                          onChange={(e) => updateWeighingRow(i, 'indication_inc', e.target.value)}
                          placeholder="0.000"
                          style={{ width: 105 }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.indication_dec}
                          onChange={(e) => updateWeighingRow(i, 'indication_dec', e.target.value)}
                          placeholder="0.000"
                          style={{ width: 105 }}
                        />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {ev.error_inc !== undefined ? fmtSigned(ev.error_inc) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {ev.error_dec !== undefined ? fmtSigned(ev.error_dec) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-muted)' }}>
                        ±{fmt(ev.mpe)}
                      </td>
                      <td>
                        {row.indication_inc || row.indication_dec ? (
                          ev.pass ? (
                            <span className="result-cell-pass">PASS</span>
                          ) : (
                            <span className="result-cell-fail">FAIL</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {(row.indication_inc || row.indication_dec) && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() =>
                              setExplainData({
                                testName: 'Weighing Performance Test (A.4.4)',
                                load: row.load,
                                unit,
                                indication: row.indication_inc || row.indication_dec,
                                error: ev.error_inc !== undefined ? ev.error_inc : ev.error_dec,
                                mpe: ev.mpe,
                                pass: ev.pass,
                                clauseRef: 'OIML R 76-1:2006 Clause A.4.4 / Table 3',
                                explanation: ev.explanation,
                                accuracyClass: cls,
                              })
                            }
                          >
                            <HelpCircle size={12} /> Why?
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setWeighingRows((r) => r.filter((_, idx) => idx !== i))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setWeighingRows((r) => [...r, { load: '', indication_inc: '', indication_dec: '' }])}
            >
              <Plus size={14} /> Add Test Load Point
            </button>
          </div>
        )}

        {/* Step 2: Repeatability */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
              Test B: Repeatability Test (Clause A.4.10)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 14 }}>
              Multiple readings at same load (~0.5 Max & ~Max). Difference between Max and Min must be ≤ {e <= 0.2 ? '0.25e' : '0.5e'} ({fmt(e <= 0.2 ? 0.25 * e : 0.5 * e)} {unit}).
            </p>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Load ({unit})</th>
                  <th colSpan={5}>Repeated Observations</th>
                  <th>Std Dev (σ)</th>
                  <th>Range (Δ)</th>
                  <th>Limit</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {repeatRows.map((row, i) => {
                  const ev = evaluatedRepeat[i] || {};
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.load}
                          onChange={(e) => updateRepeatRow(i, 'load', e.target.value)}
                          placeholder="e.g. 15"
                          style={{ width: 85 }}
                        />
                      </td>
                      {row.readings.map((rd: string, j: number) => (
                        <td key={j}>
                          <input
                            className="form-input input-numeric"
                            value={rd}
                            onChange={(e) => updateRepeatReading(i, j, e.target.value)}
                            placeholder={`#${j + 1}`}
                            style={{ width: 75 }}
                          />
                        </td>
                      ))}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{ev.std_dev ? fmt(ev.std_dev) : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{ev.range !== undefined ? fmt(ev.range) : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-muted)' }}>
                        ≤{fmt(ev.mpe_range)}
                      </td>
                      <td>
                        {ev.range !== undefined ? (
                          ev.pass ? (
                            <span className="result-cell-pass">PASS</span>
                          ) : (
                            <span className="result-cell-fail">FAIL</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setRepeatRows((r) => r.filter((_, idx) => idx !== i))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setRepeatRows((r) => [...r, { load: '', readings: ['', '', '', '', ''] }])}
            >
              <Plus size={14} /> Add Repeatability Run
            </button>
          </div>
        )}

        {/* Step 3: Eccentricity Test */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
              Test C: Eccentric Loading / Corner Load Test (Clause A.4.7)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 14 }}>
              Test load = 1/3 Max ({fmt(max / 3)} {unit}) placed on Center (reference) and 4 quadrant positions. Deviation vs Center must be ≤ MPE.
            </p>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Center Reference</th>
                  <th>Front-Left</th>
                  <th>Back-Left</th>
                  <th>Back-Right</th>
                  <th>Front-Right</th>
                  <th>Max Deviation</th>
                  <th>MPE Limit</th>
                  <th>Result</th>
                  <th>Explain</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {eccRows.map((row, i) => {
                  const ev = evaluatedEcc[i] || {};
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.center_reading}
                          onChange={(e) => updateEccRow(i, 'center_reading', e.target.value)}
                          placeholder="Center (ref)"
                          style={{ width: 95 }}
                        />
                      </td>
                      {row.positions.map((val: string, j: number) => (
                        <td key={j}>
                          <input
                            className="form-input input-numeric"
                            value={val}
                            onChange={(e) => updateEccPosition(i, j, e.target.value)}
                            placeholder={['FL', 'BL', 'BR', 'FR'][j]}
                            style={{ width: 85 }}
                          />
                          {ev.positions && ev.positions[j]?.error !== undefined && (
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--c-text-subtle)', marginTop: 2 }}>
                              {fmtSigned(ev.positions[j].error)}
                            </div>
                          )}
                        </td>
                      ))}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {ev.max_error !== undefined ? fmt(ev.max_error) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-muted)' }}>
                        ±{fmt(ev.mpe)}
                      </td>
                      <td>
                        {ev.max_error !== undefined ? (
                          ev.pass ? (
                            <span className="result-cell-pass">PASS</span>
                          ) : (
                            <span className="result-cell-fail">FAIL</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {ev.max_error !== undefined && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() =>
                              setExplainData({
                                testName: 'Eccentricity (Corner Load) Test (A.4.7)',
                                load: max / 3,
                                unit,
                                indication: row.center_reading,
                                error: ev.max_error,
                                mpe: ev.mpe,
                                pass: ev.pass,
                                clauseRef: 'OIML R 76-1:2006 Clause A.4.7',
                                formula: 'Corner Deviation = Reading(corner) - Reading(center)',
                                explanation: ev.explanation,
                                accuracyClass: cls,
                              })
                            }
                          >
                            <HelpCircle size={12} /> Why?
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setEccRows((r) => r.filter((_, idx) => idx !== i))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setEccRows((r) => [...r, { center_reading: '', positions: ['', '', '', ''] }])}
            >
              <Plus size={14} /> Add Eccentricity Row
            </button>
          </div>
        )}

        {/* Step 4: Zero, Tare & Discrimination */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
              Test D & E: Tare Accuracy & Discrimination
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 14 }}>
              Tare weighing accuracy (Clause A.4.13) and scale response to +0.4e small weight increment (Clause A.4.8).
            </p>

            <h4 style={{ fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Tare Setting & Weighing (A.4.13)</h4>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tare Load ({unit})</th>
                  <th>Net Test Load ({unit})</th>
                  <th>Observed Net Indication</th>
                  <th>Error</th>
                  <th>MPE</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tareRows.map((row, i) => {
                  const ev = evaluatedTare[i] || {};
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.tare_load}
                          onChange={(e) => updateTareRow(i, 'tare_load', e.target.value)}
                          placeholder="e.g. 5"
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.test_load}
                          onChange={(e) => updateTareRow(i, 'test_load', e.target.value)}
                          placeholder="e.g. 10"
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.net_indication}
                          onChange={(e) => updateTareRow(i, 'net_indication', e.target.value)}
                          placeholder="10.000"
                          style={{ width: 110 }}
                        />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {ev.error !== undefined ? fmtSigned(ev.error) : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text-muted)' }}>
                        ±{fmt(ev.mpe)}
                      </td>
                      <td>
                        {ev.error !== undefined ? (
                          ev.pass ? (
                            <span className="result-cell-pass">PASS</span>
                          ) : (
                            <span className="result-cell-fail">FAIL</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setTareRows((r) => r.filter((_, idx) => idx !== i))}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => setTareRows((r) => [...r, { tare_load: '', test_load: '', net_indication: '' }])}
            >
              <Plus size={14} /> Add Tare Test
            </button>

            <h4 style={{ fontSize: 14, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>Discrimination Test (A.4.8)</h4>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Applied Load ({unit})</th>
                  <th>Indication (Initial)</th>
                  <th>Indication (After +0.4e added)</th>
                  <th>Change Detected</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {discRows.map((row, i) => {
                  const ev = evaluatedDisc[i] || {};
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.test_load}
                          onChange={(e) => updateDiscRow(i, 'test_load', e.target.value)}
                          placeholder="e.g. 15"
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.reading_before}
                          onChange={(e) => updateDiscRow(i, 'reading_before', e.target.value)}
                          placeholder="Initial"
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input input-numeric"
                          value={row.reading_after}
                          onChange={(e) => updateDiscRow(i, 'reading_after', e.target.value)}
                          placeholder="+0.4e reading"
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>{ev.change_detected ? 'Yes (Triggered)' : row.reading_before && row.reading_after ? 'No' : '—'}</td>
                      <td>
                        {row.reading_before && row.reading_after ? (
                          ev.pass ? (
                            <span className="result-cell-pass">PASS</span>
                          ) : (
                            <span className="result-cell-fail">FAIL</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setDiscRows((r) => r.filter((_, idx) => idx !== i))}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => setDiscRows((r) => [...r, { test_load: '', reading_before: '', reading_after: '' }])}
            >
              <Plus size={14} /> Add Discrimination Test
            </button>
          </div>
        )}

        {/* Step 5: Evidence & Submit */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
              Step 6: Attach Test Evidence & Review Compliance Summary
            </h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 18 }}>
              Attach photographs, worksheets, and remarks to establish an unbroken evidence chain for reviewer approval.
            </p>

            {/* Compliance Review Summary Card */}
            <div style={{ background: 'var(--c-bg)', padding: 18, borderRadius: 'var(--radius)', marginBottom: 24, border: '1px solid var(--c-border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Pre-Submission Compliance Assessment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <SummaryChip label="Weighing Performance" pass={evaluatedWeighing.every((w) => w.pass)} count={evaluatedWeighing.length} />
                <SummaryChip label="Repeatability" pass={evaluatedRepeat.every((r) => r.pass)} count={evaluatedRepeat.length} />
                <SummaryChip label="Eccentricity" pass={evaluatedEcc.every((e) => e.pass)} count={evaluatedEcc.length} />
                <SummaryChip label="Tare & Discrimination" pass={evaluatedTare.every((t) => t.pass) && evaluatedDisc.every((d) => d.pass)} count={evaluatedTare.length + evaluatedDisc.length} />
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: overallOutcome === 'pass' ? 'var(--c-success-light)' : overallOutcome === 'fail' ? 'var(--c-error-light)' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: overallOutcome === 'pass' ? 'var(--c-success)' : overallOutcome === 'fail' ? 'var(--c-error)' : 'var(--c-text-muted)' }}>
                  OVERALL METROLOGICAL DECISION: {overallOutcome.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                  OIML R 76-1:2006 Standard Evaluation
                </div>
              </div>
            </div>

            {/* Evidence Uploader */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={16} color="var(--c-primary)" />
                <span>Attach Test Photographs & Observations</span>
              </h4>

              <div className="card" style={{ padding: 16, marginBottom: 14 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Evidence Category</label>
                    <select className="form-select" value={newEvidenceCategory} onChange={(e) => setNewEvidenceCategory(e.target.value)}>
                      <option value="test_setup">Test Setup Photo</option>
                      <option value="nameplate">Rating Nameplate Photo</option>
                      <option value="error_indication">Display Indication / Deviation Photo</option>
                      <option value="spec_sheet">Manufacturer Specification Document</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Title / Description *</label>
                    <input
                      className="form-input"
                      value={newEvidenceTitle}
                      onChange={(e) => setNewEvidenceTitle(e.target.value)}
                      placeholder="e.g. Corner Load Test Setup on Quadrant 2"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Image URL / Storage Reference *</label>
                    <input
                      className="form-input"
                      value={newEvidenceUrl}
                      onChange={(e) => setNewEvidenceUrl(e.target.value)}
                      placeholder="https://... or uploaded image URL"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button className="btn btn-outline btn-sm" onClick={handleAddEvidence}>
                    <Plus size={14} /> Attach Evidence Item
                  </button>
                </div>
              </div>

              {/* Evidence List Table */}
              {evidenceList.length > 0 && (
                <div className="card">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Title</th>
                        <th>Attached By</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceList.map((ev) => (
                        <tr key={ev.id}>
                          <td>
                            <span className="badge badge-class">{ev.category}</span>
                          </td>
                          <td>
                            <a href={ev.file_url} target="_blank" rel="noreferrer" className="link" style={{ fontWeight: 600 }}>
                              {ev.title}
                            </a>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{ev.uploader_name}</td>
                          <td style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                            {new Date(ev.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wizard Action Footer */}
      <div className="wizard-actions">
        <button className="btn btn-outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft size={18} /> Previous Step
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => handleSaveObservations(false)} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Next Step <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => handleSaveObservations(true)} disabled={saving}>
              <Check size={18} /> {saving ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>

      {/* Explainable Modal */}
      <ExplainableModal data={explainData} onClose={() => setExplainData(null)} />

      {node}
    </div>
  );

  function updateWeighingRow(i: number, field: string, val: string) {
    setWeighingRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }

  function updateRepeatRow(i: number, field: string, val: string) {
    setRepeatRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }

  function updateRepeatReading(i: number, j: number, val: string) {
    setRepeatRows((r) =>
      r.map((row, idx) =>
        idx === i
          ? {
              ...row,
              readings: row.readings.map((rd: string, jdx: number) => (jdx === j ? val : rd)),
            }
          : row
      )
    );
  }

  function updateEccRow(i: number, field: string, val: string) {
    setEccRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }

  function updateEccPosition(i: number, j: number, val: string) {
    setEccRows((r) =>
      r.map((row, idx) =>
        idx === i
          ? {
              ...row,
              positions: row.positions.map((p: string, jdx: number) => (jdx === j ? val : p)),
            }
          : row
      )
    );
  }

  function updateTareRow(i: number, field: string, val: string) {
    setTareRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }

  function updateDiscRow(i: number, field: string, val: string) {
    setDiscRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }
}

function SummaryChip({ label, pass, count }: { label: string; pass: boolean; count: number }) {
  return (
    <div style={{ padding: '10px 12px', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border)' }}>
      <div style={{ fontSize: 11, color: 'var(--c-text-subtle)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{count} runs</span>
        <span className={`badge ${pass ? 'badge-pass' : 'badge-fail'}`} style={{ fontSize: 11 }}>
          {pass ? 'PASS' : 'FAIL'}
        </span>
      </div>
    </div>
  );
}
