import type { AlertLevel } from './alerts';
import { computeGlycemiaAlert } from './alerts';
import type { GlycemiaMoment } from './measurements';
import type { DiabeteT2Profile } from './pathologies';
import type { DiabeteSymptomCode } from './symptoms';

// Internal equilibrium state per design doc §7 / §A.9. Never displayed to the
// user as a label (§7.6) — the app exposes factual signals only. The state
// drives the app's behaviour (CTA emphasis, copy, future notification cadence)
// but the patient never sees "you are in déséquilibre sévère".
export type EquilibriumState =
  | 'unknown' // not enough data to classify
  | 'balanced' // équilibré
  | 'slipping' // non équilibré
  | 'severe'; // déséquilibre sévère

// "Phase consultation" and "retour à l'équilibre" require state persistence
// across time (we need to know the previous state to recognise a return).
// Deferred to a follow-up PR.

export interface EquilibriumSignal {
  code: string;
  fr: string;
}

export interface EquilibriumResult {
  state: EquilibriumState;
  // Internal indicators — never surfaced as precise values to the user.
  // The app uses them to pick its behaviour, that's it.
  estimatedHbA1cPercent: number | null;
  meanGlycemia30dG_per_L: number | null;
  // Factual counters that ARE allowed to be shown (§4.5 distinguishes
  // counters from estimated indicators).
  measurementCount30d: number;
  inTargetCount30d: number;
  highEventCount30d: number; // glycémies > 2.5 (à jeun) or > 3 (post-meal)
  severeHypoCount30d: number; // value < 0.5, or < 0.7 on hypo-risk profile
  symptomReportCount30d: number;
  highestSymptomLevel30d: AlertLevel;
  // Signal list shown on the "Pourquoi maintenant ?" page. Each entry is
  // factual and citable; no internal label leaked.
  signals: EquilibriumSignal[];
}

const WINDOW_DAYS = 30;
const SEVERE_HYPO_WINDOW_DAYS = 14;
const HYPO_RISK_PROFILES: ReadonlySet<DiabeteT2Profile> = new Set(['C', 'D', 'E']);

interface MeasurementInput {
  measuredAt: string;
  value: number;
  moment: GlycemiaMoment;
}

interface SymptomReportInput {
  reportedAt: string;
  symptoms: DiabeteSymptomCode[];
  level?: AlertLevel; // if precomputed by the triage engine
}

export interface ComputeEquilibriumInputs {
  measurements: MeasurementInput[];
  symptomReports: SymptomReportInput[];
  treatmentProfile: DiabeteT2Profile;
  now?: Date;
}

function isInTarget(m: MeasurementInput): boolean {
  // Mirrors the per-row alert engine's "in target" zone (level normal).
  const { value, moment } = m;
  if (value < 0.7 || value > 3.5) return false;
  if (moment === 'post-meal-2h' || moment === 'other') {
    return value <= 1.4;
  }
  // fasting / pre-meal / bedtime
  return value <= 1.4;
}

const ALERT_RANK: Record<AlertLevel, number> = {
  normal: 0,
  level1: 1,
  level2: 2,
  level3a: 3,
  level3b: 4,
};

function within(date: string, now: number, days: number): boolean {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  return t >= now - days * 24 * 60 * 60 * 1000 && t <= now + 60_000;
}

/**
 * Estimate HbA1c (%) from a series of self-glycémies using the ADA eAG
 * formula: HbA1c% = (mean_glycemia_mg_dL + 46.7) / 28.7.
 *
 * Only returns a value if we have ≥ 10 readings spread over at least 60 days
 * (otherwise the estimate is unreliable per §A.9). Internal-only.
 */
function estimateHbA1c(measurements: MeasurementInput[]): number | null {
  if (measurements.length < 10) return null;
  const sortedTs = measurements
    .map((m) => new Date(m.measuredAt).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (sortedTs.length < 10) return null;
  const span = (sortedTs[sortedTs.length - 1]! - sortedTs[0]!) / (24 * 60 * 60 * 1000);
  if (span < 60) return null;
  const meanGperL = measurements.reduce((acc, m) => acc + m.value, 0) / measurements.length;
  const meanMgDl = meanGperL * 100;
  const hba1c = (meanMgDl + 46.7) / 28.7;
  return Math.round(hba1c * 10) / 10;
}

/**
 * Compute the internal equilibrium state for the diabète T2 vertical. Pure
 * function — no I/O, no time dependence beyond the optional `now`.
 *
 * Rules (§A.9, simplified for v1 — no "phase consultation" or "retour à
 * l'équilibre" yet, those need state persistence across runs):
 *  - severe → eHbA1c > 8.5% OR ≥ 3 glycémies > 3 g/L in last 30 days
 *           OR ≥ 2 severe-hypo events in last 14 days
 *           OR ≥ 1 level3b symptom report in last 30 days
 *  - slipping → < 70% of last-30-days readings in target,
 *             OR eHbA1c in [7.0%, 8.5%],
 *             OR ≥ 1 level2 symptom report in last 30 days
 *  - balanced → ≥ 80% in target, no level3 events, no severe hypo,
 *             AND (eHbA1c < 7.0% OR not enough data for eHbA1c)
 *  - unknown → < 5 measurements in last 30 days (cannot tell)
 *
 * Note: all messages cited HAS / SFD. Draft pending medical validation
 * (§2.6 / §14).
 */
export function computeDiabeteEquilibrium(inputs: ComputeEquilibriumInputs): EquilibriumResult {
  const now = (inputs.now ?? new Date()).getTime();

  const recent = inputs.measurements.filter((m) => within(m.measuredAt, now, WINDOW_DAYS));
  const recentReports = inputs.symptomReports.filter((r) => within(r.reportedAt, now, WINDOW_DAYS));
  const recentForHbA1c = inputs.measurements.filter((m) => within(m.measuredAt, now, 90));

  const hasHypoRisk = HYPO_RISK_PROFILES.has(inputs.treatmentProfile);

  const measurementCount = recent.length;
  const inTargetCount = recent.filter(isInTarget).length;
  const highEventCount = recent.filter((m) => m.value > 3).length;
  const severeHypoCount = inputs.measurements.filter((m) => {
    if (!within(m.measuredAt, now, SEVERE_HYPO_WINDOW_DAYS)) return false;
    if (m.value < 0.5) return true;
    if (hasHypoRisk && m.value < 0.7) return true;
    return false;
  }).length;

  const meanG = recent.length > 0 ? recent.reduce((a, m) => a + m.value, 0) / recent.length : null;
  const estimatedHbA1cPercent = estimateHbA1c(recentForHbA1c);

  // Hottest symptom report level in the last 30 days.
  let highestSymptomLevel: AlertLevel = 'normal';
  for (const r of recentReports) {
    if (!r.level) continue;
    if (ALERT_RANK[r.level] > ALERT_RANK[highestSymptomLevel]) highestSymptomLevel = r.level;
  }

  // Also derive level rough proxies from alert engine for measurements.
  let maxMeasurementAlert: AlertLevel = 'normal';
  for (const m of recent) {
    const a = computeGlycemiaAlert({ value: m.value, moment: m.moment }, inputs.treatmentProfile);
    if (ALERT_RANK[a.level] > ALERT_RANK[maxMeasurementAlert]) {
      maxMeasurementAlert = a.level;
    }
  }

  const inTargetRatio = measurementCount > 0 ? inTargetCount / measurementCount : 0;

  const signals: EquilibriumSignal[] = [];

  // Build state and signals.
  let state: EquilibriumState;

  if (measurementCount < 5) {
    state = 'unknown';
    signals.push({
      code: 'not-enough-data',
      fr: `Pas assez de mesures sur 30 jours (${measurementCount} saisie${measurementCount > 1 ? 's' : ''}) pour analyser la tendance.`,
    });
  } else if (
    (estimatedHbA1cPercent != null && estimatedHbA1cPercent > 8.5) ||
    highEventCount >= 3 ||
    severeHypoCount >= 2 ||
    highestSymptomLevel === 'level3b' ||
    maxMeasurementAlert === 'level3b'
  ) {
    state = 'severe';
  } else if (
    inTargetRatio < 0.7 ||
    (estimatedHbA1cPercent != null && estimatedHbA1cPercent >= 7 && estimatedHbA1cPercent <= 8.5) ||
    highEventCount >= 1 ||
    severeHypoCount >= 1 ||
    ALERT_RANK[highestSymptomLevel] >= ALERT_RANK.level2 ||
    ALERT_RANK[maxMeasurementAlert] >= ALERT_RANK.level2
  ) {
    state = 'slipping';
  } else {
    state = 'balanced';
  }

  // Always populate the factual signal list — these are shown verbatim to the
  // user. Counts are allowed, internal eHbA1c is not.
  if (measurementCount >= 5) {
    const pct = Math.round(inTargetRatio * 100);
    signals.push({
      code: 'measurement-count',
      fr: `${measurementCount} mesure${measurementCount > 1 ? 's' : ''} sur les 30 derniers jours, dont ${inTargetCount} dans la cible (${pct} %).`,
    });
  }
  if (highEventCount > 0) {
    signals.push({
      code: 'high-values',
      fr: `${highEventCount} mesure${highEventCount > 1 ? 's' : ''} au-dessus de 3 g/L sur 30 jours.`,
    });
  }
  if (severeHypoCount > 0) {
    signals.push({
      code: 'severe-hypo-events',
      fr: `${severeHypoCount} épisode${severeHypoCount > 1 ? 's' : ''} d'hypoglycémie marquée sur les 14 derniers jours.`,
    });
  }
  if (recentReports.length > 0) {
    signals.push({
      code: 'symptom-reports',
      fr: `${recentReports.length} signalement${recentReports.length > 1 ? 's' : ''} de symptômes sur 30 jours.`,
    });
  }
  if (meanG != null && state !== 'unknown') {
    signals.push({
      code: 'mean-glycemia',
      fr: `Glycémie moyenne récente proche de ${meanG.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g/L.`,
    });
  }

  return {
    state,
    estimatedHbA1cPercent,
    meanGlycemia30dG_per_L: meanG,
    measurementCount30d: measurementCount,
    inTargetCount30d: inTargetCount,
    highEventCount30d: highEventCount,
    severeHypoCount30d: severeHypoCount,
    symptomReportCount30d: recentReports.length,
    highestSymptomLevel30d: highestSymptomLevel,
    signals,
  };
}

/**
 * Translate the internal state into a user-facing tone — without ever naming
 * the state. Per §7.6, the user sees behaviour ("plus présente" / "plus
 * discrète") rather than a clinical label.
 */
export function explainEquilibriumPresence(state: EquilibriumState): {
  title: string;
  body: string;
} {
  switch (state) {
    case 'severe':
      return {
        title: 'L’app est plus attentive ces prochains jours',
        body: 'Les signaux récents méritent un suivi rapproché. On va te suggérer plus souvent de mesurer ou de partager ce que tu ressens.',
      };
    case 'slipping':
      return {
        title: 'Quelques signaux à surveiller cette semaine',
        body: 'Certains éléments sortent un peu de la cible habituelle. On continue à observer avec toi sans alarmer.',
      };
    case 'balanced':
      return {
        title: 'Le suivi est dans le vert',
        body: 'Tes mesures récentes restent globalement dans la cible. L’app reste discrète et observe.',
      };
    case 'unknown':
    default:
      return {
        title: 'Pas encore assez de données pour analyser la tendance',
        body: 'Une fois que tu auras saisi quelques mesures sur deux ou trois semaines, on pourra te dire à quoi l’app réagit.',
      };
  }
}
