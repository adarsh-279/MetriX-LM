// OIML R-76 Non-Automatic Weighing Instruments — Client calculation engine
// Implements Table 1 accuracy classes, Table 3 MPE calculations, and test verification logic
// per OIML Recommendation R-76-1 (2006) & SIH PS 26035.

export type AccuracyClass = 'I' | 'II' | 'III' | 'IIII';

export interface ClassLimits {
  name: string;
  eMin: number;
  nMin: number;
  nMax: number;
  minCapacityMultiplier: number;
}

export const CLASS_DEFINITIONS: Record<AccuracyClass, ClassLimits> = {
  I: {
    name: 'Special Accuracy (Class I)',
    eMin: 0.001,
    nMin: 50000,
    nMax: 1000000,
    minCapacityMultiplier: 100,
  },
  II: {
    name: 'High Accuracy (Class II)',
    eMin: 0.001,
    nMin: 100,
    nMax: 100000,
    minCapacityMultiplier: 50,
  },
  III: {
    name: 'Medium Accuracy (Class III)',
    eMin: 0.1,
    nMin: 100,
    nMax: 10000,
    minCapacityMultiplier: 20,
  },
  IIII: {
    name: 'Ordinary Accuracy (Class IIII)',
    eMin: 1.0,
    nMin: 100,
    nMax: 1000,
    minCapacityMultiplier: 10,
  },
};

export function validateInstrumentClass(
  accuracyClass: AccuracyClass,
  e: number,
  max: number,
  min?: number
): { valid: boolean; n: number; minRequired: number; reason?: string } {
  const limits = CLASS_DEFINITIONS[accuracyClass];
  if (!limits) return { valid: false, n: 0, minRequired: 0, reason: `Unknown class ${accuracyClass}` };

  const n = Math.round(max / e);
  const minRequired = limits.minCapacityMultiplier * e;

  if (n < limits.nMin) {
    return {
      valid: false,
      n,
      minRequired,
      reason: `n = ${n.toLocaleString()} is below minimum ${limits.nMin.toLocaleString()} for Class ${accuracyClass}`,
    };
  }
  if (n > limits.nMax) {
    return {
      valid: false,
      n,
      minRequired,
      reason: `n = ${n.toLocaleString()} exceeds maximum ${limits.nMax.toLocaleString()} for Class ${accuracyClass}`,
    };
  }
  if (min !== undefined && min < minRequired) {
    return {
      valid: false,
      n,
      minRequired,
      reason: `Min capacity (${min}) is below required (${minRequired}) for Class ${accuracyClass}`,
    };
  }

  return { valid: true, n, minRequired };
}

// Backward compatibility helper
export const isClassValid = (cls: AccuracyClass, e: number, max: number) => validateInstrumentClass(cls, e, max);

export function getMPEForLoad(
  load: number,
  e: number,
  accuracyClass: AccuracyClass
): { mpe: number; multiplier: number; stepRange: string } {
  const m = load / e;
  let multiplier = 1.0;
  let stepRange = '';

  switch (accuracyClass) {
    case 'I':
      if (m <= 50000) {
        multiplier = 0.5;
        stepRange = '0 ≤ m ≤ 50,000 e (±0.5 e)';
      } else if (m <= 200000) {
        multiplier = 1.0;
        stepRange = '50,000 e < m ≤ 200,000 e (±1.0 e)';
      } else {
        multiplier = 1.5;
        stepRange = '200,000 e < m ≤ Max (±1.5 e)';
      }
      break;

    case 'II':
      if (m <= 5000) {
        multiplier = 0.5;
        stepRange = '0 ≤ m ≤ 5,000 e (±0.5 e)';
      } else if (m <= 20000) {
        multiplier = 1.0;
        stepRange = '5,000 e < m ≤ 20,000 e (±1.0 e)';
      } else {
        multiplier = 1.5;
        stepRange = '20,000 e < m ≤ Max (±1.5 e)';
      }
      break;

    case 'III':
      if (m <= 500) {
        multiplier = 0.5;
        stepRange = '0 ≤ m ≤ 500 e (±0.5 e)';
      } else if (m <= 2000) {
        multiplier = 1.0;
        stepRange = '500 e < m ≤ 2,000 e (±1.0 e)';
      } else {
        multiplier = 1.5;
        stepRange = '2,000 e < m ≤ Max (±1.5 e)';
      }
      break;

    case 'IIII':
      if (m <= 50) {
        multiplier = 0.5;
        stepRange = '0 ≤ m ≤ 50 e (±0.5 e)';
      } else if (m <= 200) {
        multiplier = 1.0;
        stepRange = '50 e < m ≤ 200 e (±1.0 e)';
      } else {
        multiplier = 1.5;
        stepRange = '200 e < m ≤ Max (±1.5 e)';
      }
      break;

    default:
      multiplier = 1.0;
      stepRange = 'Default (±1.0 e)';
  }

  const mpe = Math.abs(e * multiplier);
  return { mpe, multiplier, stepRange };
}

export function mpeForLoad(load: number, e: number, cls: AccuracyClass): number {
  return getMPEForLoad(load, e, cls).mpe;
}

export function evaluateWeighingPoint(
  load: number,
  e: number,
  accuracyClass: AccuracyClass,
  indicationInc?: number,
  indicationDec?: number
) {
  const { mpe, multiplier, stepRange } = getMPEForLoad(load, e, accuracyClass);
  const errorInc = indicationInc !== undefined ? indicationInc - load : undefined;
  const errorDec = indicationDec !== undefined ? indicationDec - load : undefined;

  const passInc = errorInc !== undefined ? Math.abs(errorInc) <= mpe + 1e-9 : true;
  const passDec = errorDec !== undefined ? Math.abs(errorDec) <= mpe + 1e-9 : true;
  const pass = passInc && passDec && (indicationInc !== undefined || indicationDec !== undefined);

  let explanation = '';
  if (indicationInc !== undefined || indicationDec !== undefined) {
    const maxObsError = Math.max(
      errorInc !== undefined ? Math.abs(errorInc) : 0,
      errorDec !== undefined ? Math.abs(errorDec) : 0
    );
    const excess = Math.max(0, maxObsError - mpe);
    if (pass) {
      explanation = `PASS: Maximum observed error (${fmt(maxObsError)}) is within MPE (±${fmt(mpe)} = ${multiplier}e) for load step [${stepRange}] per OIML R 76-1 Table 3.`;
    } else {
      explanation = `FAIL: Observed error (${fmt(maxObsError)}) exceeds MPE (±${fmt(mpe)}) by ${fmt(excess)} per OIML R 76-1 Table 3.`;
    }
  }

  return {
    load,
    indication_inc: indicationInc,
    indication_dec: indicationDec,
    error_inc: errorInc,
    error_dec: errorDec,
    mpe,
    pass,
    explanation,
  };
}

export function evaluateRepeatability(load: number, readings: number[], e: number) {
  const validReadings = readings.filter((r) => r !== null && !isNaN(r));
  const mpeRange = e <= 0.2 ? 0.25 * e : 0.5 * e;
  const limitLabel = e <= 0.2 ? '0.25e' : '0.5e';

  if (validReadings.length < 2) {
    return {
      load,
      readings: validReadings,
      mpe_range: mpeRange,
      pass: false,
      explanation: 'Incomplete: At least 2 repeated measurements required for repeatability evaluation.',
    };
  }

  const maxVal = Math.max(...validReadings);
  const minVal = Math.min(...validReadings);
  const range = maxVal - minVal;

  const n = validReadings.length;
  const mean = validReadings.reduce((a, b) => a + b, 0) / n;
  const variance = validReadings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  const pass = range <= mpeRange + 1e-9;
  const excess = Math.max(0, range - mpeRange);

  const explanation = pass
    ? `PASS: Measured range (${fmt(range)}) ≤ permissible limit (${fmt(mpeRange)} = ${limitLabel}) over ${n} readings (std dev = ${fmt(stdDev)}) per OIML R 76-1 Clause A.4.10.`
    : `FAIL: Measured range (${fmt(range)}) exceeds allowed limit (${fmt(mpeRange)} = ${limitLabel}) by ${fmt(excess)} per OIML R 76-1 Clause A.4.10.`;

  return {
    load,
    readings: validReadings,
    max_val: maxVal,
    min_val: minVal,
    range,
    std_dev: stdDev,
    mpe_range: mpeRange,
    pass,
    explanation,
  };
}

export function evaluateEccentricity(
  testLoad: number,
  centerReading: number | undefined,
  positionInputs: { position: string; reading?: number }[],
  e: number,
  accuracyClass: AccuracyClass
) {
  const { mpe, multiplier } = getMPEForLoad(testLoad, e, accuracyClass);
  const positions = positionInputs.map((p) => {
    const error = centerReading !== undefined && p.reading !== undefined ? p.reading - centerReading : undefined;
    return { position: p.position, reading: p.reading, error };
  });

  const validErrors = positions
    .filter((p) => p.position !== 'Center' && p.error !== undefined)
    .map((p) => Math.abs(p.error!));

  const maxError = validErrors.length > 0 ? Math.max(...validErrors) : undefined;
  const pass =
    centerReading !== undefined && validErrors.length > 0 && (maxError !== undefined ? maxError <= mpe + 1e-9 : false);

  let explanation = '';
  if (maxError !== undefined) {
    const excess = Math.max(0, maxError - mpe);
    if (pass) {
      explanation = `PASS: Maximum corner deviation (${fmt(maxError)}) vs center reference is within MPE (±${fmt(mpe)} = ${multiplier}e) per OIML R 76-1 Clause A.4.7.`;
    } else {
      explanation = `FAIL: Corner deviation (${fmt(maxError)}) exceeds MPE (±${fmt(mpe)}) by ${fmt(excess)} per OIML R 76-1 Clause A.4.7.`;
    }
  }

  return {
    test_load: testLoad,
    center_reading: centerReading,
    positions,
    max_error: maxError,
    mpe,
    pass,
    explanation,
  };
}

export function evaluateZeroTare(
  tareLoad: number,
  testLoad: number,
  netIndication: number | undefined,
  e: number,
  accuracyClass: AccuracyClass
) {
  const { mpe, multiplier } = getMPEForLoad(testLoad, e, accuracyClass);
  const error = netIndication !== undefined ? netIndication - testLoad : undefined;
  const pass = error !== undefined ? Math.abs(error) <= mpe + 1e-9 : false;

  let explanation = '';
  if (error !== undefined) {
    const absError = Math.abs(error);
    const excess = Math.max(0, absError - mpe);
    if (pass) {
      explanation = `PASS: Tare net indication error (${fmt(absError)}) is within MPE (±${fmt(mpe)} = ${multiplier}e) per OIML R 76-1 Clause A.4.13.`;
    } else {
      explanation = `FAIL: Tare net indication error (${fmt(absError)}) exceeds MPE (±${fmt(mpe)}) by ${fmt(excess)} per OIML R 76-1 Clause A.4.13.`;
    }
  }

  return {
    tare_load: tareLoad,
    test_load: testLoad,
    net_indication: netIndication,
    error,
    mpe,
    pass,
    explanation,
  };
}

export function evaluateDiscrimination(
  testLoad: number,
  readingBefore: number | undefined,
  readingAfter: number | undefined
) {
  const changeDetected =
    readingBefore !== undefined && readingAfter !== undefined && readingAfter !== readingBefore;
  const pass = changeDetected;

  const explanation = pass
    ? `PASS: Scale indication changed (${fmt(readingBefore)} -> ${fmt(readingAfter)}) upon addition of 0.4e weights per OIML R 76-1 Clause A.4.8.`
    : `FAIL: No change in indication detected after adding 0.4e incremental load per OIML R 76-1 Clause A.4.8.`;

  return {
    test_load: testLoad,
    reading_before: readingBefore,
    reading_after: readingAfter,
    change_detected: changeDetected,
    pass,
    explanation,
  };
}

export function computeOverallCompliance(results: { pass: boolean }[]): 'pass' | 'fail' | 'pending' {
  if (results.length === 0) return 'pending';
  return results.every((r) => r.pass) ? 'pass' : 'fail';
}

export function overallResult(passes: boolean[]): 'pass' | 'fail' | 'pending' {
  return computeOverallCompliance(passes.map((p) => ({ pass: p })));
}

export function fmt(n: number | null | undefined, decimals = 3): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return parseFloat(n.toFixed(decimals)).toString();
}

export function fmtSigned(n: number | null | undefined, decimals = 3): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const s = fmt(n, decimals);
  return n > 0 ? `+${s}` : s;
}
