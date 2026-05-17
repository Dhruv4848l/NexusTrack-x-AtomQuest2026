export type UomType = "numeric_min" | "numeric_max" | "percent_min" | "percent_max" | "timeline" | "zero";

/** Compute progress score 0-100 (capped) per UoM. */
export function computeScore(opts: {
  uom: UomType;
  target: number | null;
  targetDate?: string | null;
  actual: number | null;
  actualDate?: string | null;
}): number | null {
  const { uom, target, actual, targetDate, actualDate } = opts;
  if (uom === "zero") {
    if (actual == null) return null;
    return actual === 0 ? 100 : 0;
  }
  if (uom === "timeline") {
    if (!targetDate) return null;
    if (!actualDate) return 0;
    const t = new Date(targetDate).getTime();
    const a = new Date(actualDate).getTime();
    return a <= t ? 100 : 0;
  }
  if (target == null || actual == null) return null;
  if (uom === "numeric_min" || uom === "percent_min") {
    if (target === 0) return actual >= 0 ? 100 : 0;
    return Math.max(0, Math.min(150, (actual / target) * 100));
  }
  // max (lower is better)
  if (actual === 0) return 100;
  return Math.max(0, Math.min(150, (target / actual) * 100));
}

export const UOM_LABEL: Record<UomType, string> = {
  numeric_min: "Numeric (Higher is better)",
  numeric_max: "Numeric (Lower is better)",
  percent_min: "% (Higher is better)",
  percent_max: "% (Lower is better)",
  timeline: "Timeline (Date-based)",
  zero: "Zero-based (0 = success)",
};

/** Aliases used by migrated MERN pages */
export const UOM_LABELS = UOM_LABEL;
export const UOM_TYPES = Object.keys(UOM_LABEL) as UomType[];

export const THRUST_AREAS = [
  "Revenue Growth",
  "Operational Excellence",
  "Customer Experience",
  "People & Culture",
  "Innovation",
  "Cost Optimization",
  "Quality & Compliance",
  "Strategic Initiatives",
];
