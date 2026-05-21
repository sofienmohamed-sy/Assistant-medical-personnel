import type { AlertLevel } from './alerts';
import { computeGlycemiaAlert } from './alerts';
import type { GlycemiaMoment } from './measurements';
import type { DiabeteT2Profile } from './pathologies';
import type { DiabeteSymptomCategory, DiabeteSymptomCode } from './symptoms';
import { categoryOf, computeDiabeteSymptomTriage } from './symptoms';

// Pure assembly of a diabète T2 visit summary, ready to be printed for a
// doctor visit. No prescriptive text — only counts and aggregates over a
// chosen window.

export interface RapportPeriod {
  startMs: number;
  endMs: number;
}

export interface GlycemiaSummary {
  count: number;
  countByLevel: Record<AlertLevel, number>;
  meanGperL: number | null;
  minGperL: number | null;
  maxGperL: number | null;
  highValueCount: number; // > 2 g/L
  severeHypoCount: number; // value < 0.5, or < 0.7 on hypo-risk profile
  inTargetRatio: number | null; // 0..1, null if count == 0
}

export interface SymptomSummary {
  reportCount: number;
  byCategory: Record<DiabeteSymptomCategory, number>;
  worstLevel: AlertLevel;
}

export interface HbA1cSnapshot {
  value: number;
  measuredAt: string;
  labName?: string;
}

interface MeasurementSummaryInput {
  measuredAt: string;
  value: number;
  moment: GlycemiaMoment;
}

interface SymptomReportSummaryInput {
  reportedAt: string;
  symptoms: DiabeteSymptomCode[];
}

interface HbA1cSummaryInput {
  measuredAt: string;
  value: number;
  labName?: string;
}

export interface DiabeteRapportInputs {
  period: RapportPeriod;
  treatmentProfile: DiabeteT2Profile;
  measurements: MeasurementSummaryInput[];
  symptomReports: SymptomReportSummaryInput[];
  hba1cMeasurements: HbA1cSummaryInput[];
}

export interface DiabeteRapport {
  period: RapportPeriod;
  treatmentProfile: DiabeteT2Profile;
  glycemia: GlycemiaSummary;
  symptoms: SymptomSummary;
  hba1cLatest: HbA1cSnapshot | null;
  hba1cHistory: HbA1cSnapshot[];
}

const ALERT_RANK: Record<AlertLevel, number> = {
  normal: 0,
  level1: 1,
  level2: 2,
  level3a: 3,
  level3b: 4,
};

const HYPO_RISK_PROFILES: ReadonlySet<DiabeteT2Profile> = new Set(['C', 'D', 'E']);

function withinPeriod(iso: string, period: RapportPeriod): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= period.startMs && t <= period.endMs;
}

/**
 * Build a print-ready summary for a diabète T2 doctor visit. Pure function
 * — no time dependence, no I/O. Counts and aggregates only; no prescriptive
 * text. The caller picks the window via `period`.
 */
export function computeDiabeteRapport(inputs: DiabeteRapportInputs): DiabeteRapport {
  const { period, treatmentProfile, measurements, symptomReports, hba1cMeasurements } = inputs;

  // ---- Glycémie summary ----------------------------------------------------
  const glycemiaInPeriod = measurements.filter((m) => withinPeriod(m.measuredAt, period));
  const countByLevel: Record<AlertLevel, number> = {
    normal: 0,
    level1: 0,
    level2: 0,
    level3a: 0,
    level3b: 0,
  };
  let sum = 0;
  let minG: number | null = null;
  let maxG: number | null = null;
  let highValueCount = 0;
  let inTargetCount = 0;
  for (const m of glycemiaInPeriod) {
    const alert = computeGlycemiaAlert({ value: m.value, moment: m.moment }, treatmentProfile);
    countByLevel[alert.level] += 1;
    if (alert.level === 'normal') inTargetCount += 1;
    sum += m.value;
    minG = minG == null ? m.value : Math.min(minG, m.value);
    maxG = maxG == null ? m.value : Math.max(maxG, m.value);
    if (m.value > 2) highValueCount += 1;
  }
  const hasHypoRisk = HYPO_RISK_PROFILES.has(treatmentProfile);
  const severeHypoCount = glycemiaInPeriod.filter((m) => {
    if (m.value < 0.5) return true;
    return hasHypoRisk && m.value < 0.7;
  }).length;
  const count = glycemiaInPeriod.length;
  const glycemia: GlycemiaSummary = {
    count,
    countByLevel,
    meanGperL: count > 0 ? sum / count : null,
    minGperL: minG,
    maxGperL: maxG,
    highValueCount,
    severeHypoCount,
    inTargetRatio: count > 0 ? inTargetCount / count : null,
  };

  // ---- Symptom summary -----------------------------------------------------
  const reportsInPeriod = symptomReports.filter((r) => withinPeriod(r.reportedAt, period));
  const byCategory: Record<DiabeteSymptomCategory, number> = {
    hypo: 0,
    hyperChronic: 0,
    acidocetose: 0,
    severity: 0,
  };
  let worstSymptomLevel: AlertLevel = 'normal';
  for (const r of reportsInPeriod) {
    for (const code of r.symptoms) {
      byCategory[categoryOf(code)] += 1;
    }
    const triage = computeDiabeteSymptomTriage(r.symptoms, treatmentProfile);
    if (ALERT_RANK[triage.level] > ALERT_RANK[worstSymptomLevel]) {
      worstSymptomLevel = triage.level;
    }
  }
  const symptoms: SymptomSummary = {
    reportCount: reportsInPeriod.length,
    byCategory,
    worstLevel: worstSymptomLevel,
  };

  // ---- HbA1c snapshot ------------------------------------------------------
  // Show every recorded HbA1c (typically quarterly), not filtered by period.
  // The doctor wants the trend regardless of the chosen reporting window.
  const sortedHbA1c = [...hba1cMeasurements].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
  );
  const history: HbA1cSnapshot[] = sortedHbA1c.map((m) => ({
    value: m.value,
    measuredAt: m.measuredAt,
    labName: m.labName,
  }));
  const latest = history[0] ?? null;

  return {
    period,
    treatmentProfile,
    glycemia,
    symptoms,
    hba1cLatest: latest,
    hba1cHistory: history,
  };
}

export const RAPPORT_PERIOD_PRESETS = [
  { code: '4w', days: 28, labelFr: '4 dernières semaines' },
  { code: '12w', days: 84, labelFr: '3 derniers mois' },
] as const;
export type RapportPeriodCode = (typeof RAPPORT_PERIOD_PRESETS)[number]['code'];

export function buildPeriod(code: RapportPeriodCode, now: Date = new Date()): RapportPeriod {
  const preset = RAPPORT_PERIOD_PRESETS.find((p) => p.code === code) ?? RAPPORT_PERIOD_PRESETS[0]!;
  const end = now.getTime();
  const start = end - preset.days * 24 * 60 * 60 * 1000;
  return { startMs: start, endMs: end };
}
