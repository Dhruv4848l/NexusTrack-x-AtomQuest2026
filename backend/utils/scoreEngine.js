/**
 * Compute progress score 0-150 (capped) per UoM type.
 * Mirrors the logic from src/lib/scoring.ts
 */
function computeScore({ uom, target, targetDate, actual, actualDate }) {
  if (uom === 'zero') {
    if (actual == null) return null;
    return actual === 0 ? 100 : 0;
  }
  if (uom === 'timeline') {
    if (!targetDate) return null;
    if (!actualDate) return 0;
    const t = new Date(targetDate).getTime();
    const a = new Date(actualDate).getTime();
    return a <= t ? 100 : 0;
  }
  if (target == null || actual == null) return null;
  if (uom === 'numeric_min' || uom === 'percent_min') {
    if (target === 0) return actual >= 0 ? 100 : 0;
    return Math.max(0, Math.min(150, (actual / target) * 100));
  }
  // numeric_max / percent_max — lower is better
  if (actual === 0) return 100;
  return Math.max(0, Math.min(150, (target / actual) * 100));
}

const UOM_LABELS = {
  numeric_min: 'Numeric (Higher is better)',
  numeric_max: 'Numeric (Lower is better)',
  percent_min: '% (Higher is better)',
  percent_max: '% (Lower is better)',
  timeline: 'Timeline (Date-based)',
  zero: 'Zero-based (0 = success)',
};

const THRUST_AREAS = [
  'Revenue Growth',
  'Operational Excellence',
  'Customer Experience',
  'People & Culture',
  'Innovation',
  'Cost Optimization',
  'Quality & Compliance',
  'Strategic Initiatives',
];

const UOM_TYPES = ['numeric_min', 'numeric_max', 'percent_min', 'percent_max', 'timeline', 'zero'];

module.exports = { computeScore, UOM_LABELS, THRUST_AREAS, UOM_TYPES };
