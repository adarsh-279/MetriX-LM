import type { AccuracyClass } from '../types/index.js';

export interface ExtractedSpec {
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  accuracy_class?: AccuracyClass;
  max_capacity?: number;
  verification_scale_interval?: number;
  actual_scale_interval?: number;
  min_capacity?: number;
  tare_max?: number;
  unit?: string;
  confidence: number;
  extracted_fields: string[];
}

/**
 * AI-Assisted Specification Extraction Service
 * Parses raw datasheet text / catalog parameters and extracts structured NAWI parameters.
 * Note: AI assists data entry; human verification is required.
 */
export function extractSpecificationsFromText(rawText: string): ExtractedSpec {
  const result: ExtractedSpec = {
    confidence: 0.85,
    extracted_fields: [],
  };

  const text = rawText.replace(/\r\n/g, '\n');

  // Manufacturer matching
  const mfgMatch = text.match(/(?:Manufacturer|Brand|Make|Company)[:\s]+([^\n,;]+)/i);
  if (mfgMatch) {
    result.manufacturer = mfgMatch[1].trim();
    result.extracted_fields.push('manufacturer');
  }

  // Model matching
  const modelMatch = text.match(/(?:Model|Type|Model\s*No\.?)[:\s]+([^\n,;]+)/i);
  if (modelMatch) {
    result.model = modelMatch[1].trim();
    result.extracted_fields.push('model');
  }

  // Serial Number matching
  const snMatch = text.match(/(?:Serial\s*No\.?|S\/N|Serial)[:\s]+([^\n,;]+)/i);
  if (snMatch) {
    result.serial_number = snMatch[1].trim();
    result.extracted_fields.push('serial_number');
  }

  // Accuracy Class matching (Class I, II, III, IIII or Special, High, Medium, Ordinary)
  if (/Class\s*(?:I|Special)\b/i.test(text) && !/Class\s*(?:II|III|IIII)/i.test(text)) {
    result.accuracy_class = 'I';
    result.extracted_fields.push('accuracy_class');
  } else if (/Class\s*(?:II|High)\b/i.test(text) && !/Class\s*(?:III|IIII)/i.test(text)) {
    result.accuracy_class = 'II';
    result.extracted_fields.push('accuracy_class');
  } else if (/Class\s*(?:III|Medium)\b/i.test(text) && !/Class\s*IIII/i.test(text)) {
    result.accuracy_class = 'III';
    result.extracted_fields.push('accuracy_class');
  } else if (/Class\s*(?:IIII|Ordinary|4)\b/i.test(text)) {
    result.accuracy_class = 'IIII';
    result.extracted_fields.push('accuracy_class');
  }

  // Max Capacity matching: Max = 30 kg, Max: 220g, Maximum Capacity: 1500 kg
  const maxMatch = text.match(/(?:Max(?:imum)?(?:\s*Capacity)?|Capacity)[:\s=]+([0-9.,]+)\s*(kg|g|mg|t)?/i);
  if (maxMatch) {
    result.max_capacity = parseFloat(maxMatch[1].replace(/,/g, ''));
    result.extracted_fields.push('max_capacity');
    if (maxMatch[2]) result.unit = maxMatch[2].toLowerCase();
  }

  // Verification scale interval (e): e = 10 g, e: 0.01 kg, e = 1 mg
  const eMatch = text.match(/(?:Verification\s*Scale\s*Interval|Scale\s*Interval|\be\b)[:\s=]+([0-9.,]+)\s*(kg|g|mg)?/i);
  if (eMatch) {
    result.verification_scale_interval = parseFloat(eMatch[1].replace(/,/g, ''));
    result.extracted_fields.push('verification_scale_interval');
    if (!result.unit && eMatch[2]) result.unit = eMatch[2].toLowerCase();
  }

  // Actual scale interval (d): d = 10 g, d: 0.1 mg
  const dMatch = text.match(/(?:Actual\s*Scale\s*Interval|Readability|\bd\b)[:\s=]+([0-9.,]+)\s*(kg|g|mg)?/i);
  if (dMatch) {
    result.actual_scale_interval = parseFloat(dMatch[1].replace(/,/g, ''));
    result.extracted_fields.push('actual_scale_interval');
  } else if (result.verification_scale_interval) {
    result.actual_scale_interval = result.verification_scale_interval;
  }

  // Min Capacity matching: Min = 200 g, Min: 100e
  const minMatch = text.match(/(?:Min(?:imum)?(?:\s*Capacity)?|\bMin\b)[:\s=]+([0-9.,]+)\s*(kg|g|mg)?/i);
  if (minMatch) {
    result.min_capacity = parseFloat(minMatch[1].replace(/,/g, ''));
    result.extracted_fields.push('min_capacity');
  }

  // Tare Max matching: Max Tare = 10 kg, Tare: 100% Max
  const tareMatch = text.match(/(?:Max(?:imum)?\s*Tare|Tare\s*Range|\bTare\b)[:\s=]+([0-9.,]+)\s*(kg|g|mg)?/i);
  if (tareMatch) {
    result.tare_max = parseFloat(tareMatch[1].replace(/,/g, ''));
    result.extracted_fields.push('tare_max');
  }

  if (!result.unit) result.unit = 'kg';

  return result;
}

/**
 * AI Failure Explainer Assistant
 * Synthesizes test observations, calculation deviations, and standard clauses into an actionable regulatory explanation.
 */
export function generateTestExplanation(
  testType: string,
  data: {
    observedValue?: number;
    referenceValue?: number;
    error?: number;
    mpe?: number;
    pass: boolean;
    standardClause?: string;
  }
): string {
  const { error, mpe, pass, standardClause } = data;
  const clause = standardClause || 'OIML R 76-1:2006';

  if (pass) {
    return `The instrument satisfies metrological accuracy criteria under ${clause}. The recorded deviation (|E| = ${error !== undefined ? Math.abs(error) : 0}) remains strictly within the statutory Maximum Permissible Error threshold of ±${mpe || 0}. No non-conformity was detected.`;
  } else {
    const excess = (error !== undefined && mpe !== undefined) ? Math.abs(error) - mpe : 0;
    return `NON-CONFORMITY DETECTED: Under ${clause}, the recorded deviation (|E| = ${error !== undefined ? Math.abs(error) : 0}) exceeds the allowed tolerance of ±${mpe || 0} by an excess margin of ${excess > 0 ? excess.toFixed(3) : '0'}. Recommended corrective action: Inspect load cell mounting, ensure level bubble centering, and recalibrate corner span prior to re-verification.`;
  }
}
