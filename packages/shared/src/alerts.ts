import type { DiabeteT2Profile } from './pathologies';
import type { GlycemiaMoment } from './measurements';

// Alert hierarchy per design doc §A.5.
// IMPORTANT: All thresholds, messages and recommendations below come from the
// design doc compiled from public HAS / SFD sources. They MUST be reviewed by
// a medical professional before going to production (principe §2.6 / annexe
// §14). Until that review, the UI marks any surveillance output as a draft
// pending validation.
export type AlertLevel = 'normal' | 'level1' | 'level2' | 'level3a' | 'level3b';

export const ALERT_LEVEL_RANK: Record<AlertLevel, number> = {
  normal: 0,
  level1: 1,
  level2: 2,
  level3a: 3,
  level3b: 4,
};

export const ALERT_LEVEL_LABELS_FR: Record<AlertLevel, string> = {
  normal: 'Dans la cible',
  level1: 'Information',
  level2: 'À surveiller — consulte ton médecin',
  level3a: 'Urgence relative — plan d’urgence',
  level3b: 'Urgence vitale — appelle le 15',
};

export interface GlycemiaAlertResult {
  level: AlertLevel;
  reasonCode: string;
  title: string;
  message: string;
  recommendation: string;
  sources: string[];
}

const SOURCES_HAS_SFD = ['HAS 2024 — Diabète de type 2', 'Société Francophone du Diabète'];

const HYPO_RISK_PROFILES: ReadonlySet<DiabeteT2Profile> = new Set(['C', 'D', 'E']);

function fmt(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Classify a single glycémie measurement against the §A.5 alert hierarchy.
 *
 * The result reflects the worst threshold the individual reading crosses.
 * Repetition-based escalation (e.g. "plusieurs valeurs > 2 g/L sur la
 * semaine → niveau 2") is handled separately by the tendance helpers.
 */
export function computeGlycemiaAlert(
  measurement: { value: number; moment: GlycemiaMoment },
  treatmentProfile: DiabeteT2Profile,
): GlycemiaAlertResult {
  const { value, moment } = measurement;
  const hasHypoRisk = HYPO_RISK_PROFILES.has(treatmentProfile);
  const v = fmt(value);

  // Severe hypoglycemia — always urgence vitale, independent of profile.
  if (value < 0.5) {
    return {
      level: 'level3b',
      reasonCode: 'severe-hypo',
      title: 'Urgence vitale — hypoglycémie sévère',
      message: `Glycémie à ${v} g/L : c’est très en-dessous du seuil de sécurité (0,70 g/L).`,
      recommendation:
        // Per spec §2.1 the app never prescribes treatment: it routes the
        // patient to their own plan d'urgence + emergency services. The
        // specific actions (sugar source, doses, etc.) belong to the plan
        // the user has built with their doctor.
        'Consulte ton plan d’urgence personnel. Mets-toi en sécurité : reste assis·e, ne conduis pas. Si tu te sens mal ou si tu as des troubles de la conscience, appelle le 15 immédiatement.',
      sources: SOURCES_HAS_SFD,
    };
  }

  // Severe hyperglycemia — keto-acidosis red zone.
  if (value > 3.5) {
    return {
      level: 'level3b',
      reasonCode: 'severe-hyper',
      title: 'Urgence vitale — hyperglycémie sévère',
      message: `Glycémie à ${v} g/L : valeur très élevée évoquant un risque de décompensation acidocétosique.`,
      recommendation:
        'Si tu as des nausées, des vomissements, une haleine inhabituelle ou une respiration rapide, appelle le 15. Sinon, consulte ton plan d’urgence personnel et contacte ton médecin sans tarder.',
      sources: SOURCES_HAS_SFD,
    };
  }

  // Hypoglycemia in the 0.5–0.7 zone — only meaningful for hypo-risk profiles
  // (sulfamides, insulines). For purely hygiéno-diététique or ADO sans risque,
  // a value of 0.65 g/L is unusual but not alarming.
  if (hasHypoRisk && value < 0.7) {
    return {
      level: 'level3a',
      reasonCode: 'hypo-resucrage',
      title: 'Hypoglycémie — applique ton plan personnel',
      message: `Glycémie à ${v} g/L : en-dessous du seuil de 0,70 g/L chez un patient sous traitement à risque d’hypoglycémie.`,
      recommendation:
        'Consulte ton plan d’urgence personnel. Mets-toi en sécurité : reste assis·e, ne conduis pas. Mesure à nouveau ta glycémie selon les indications de ton plan. En cas de doute ou si tu te sens mal, appelle ton médecin ou le 15.',
      sources: SOURCES_HAS_SFD,
    };
  }

  const isFastingLike = moment === 'fasting' || moment === 'pre-meal' || moment === 'bedtime';

  if (isFastingLike) {
    if (value > 2.5) {
      return {
        level: 'level3a',
        reasonCode: 'fasting-very-high',
        title: 'Glycémie à jeun très élevée',
        message: `Glycémie à jeun à ${v} g/L : largement au-dessus de la cible (< 1,10 g/L à jeun, source HAS).`,
        recommendation:
          'Recontrôle dans 15 minutes pour confirmer. Si la valeur reste élevée ou si tu as des symptômes (soif intense, nausées, somnolence), contacte ton médecin aujourd’hui ou applique ton plan d’urgence.',
        sources: SOURCES_HAS_SFD,
      };
    }
    if (value > 2) {
      return {
        level: 'level1',
        reasonCode: 'fasting-high',
        title: 'Glycémie à jeun élevée',
        message: `Glycémie à ${v} g/L hors période repas, au-dessus de 2 g/L.`,
        recommendation:
          'Une valeur isolée peut s’expliquer par un stress, un repas tardif ou un médicament. Si plusieurs valeurs élevées sur la semaine, parle-en à ton médecin.',
        sources: SOURCES_HAS_SFD,
      };
    }
    if (value > 1.4) {
      return {
        level: 'level1',
        reasonCode: 'fasting-above-target',
        title: 'Glycémie au-dessus de la cible à jeun',
        message: `Glycémie à ${v} g/L hors période repas, au-dessus de la cible usuelle (< 1,10 g/L à jeun, source HAS).`,
        recommendation:
          'Observe le contexte (sommeil, activité, repas de la veille). Si la tendance se maintient, en parler à ton médecin lors du prochain rendez-vous.',
        sources: SOURCES_HAS_SFD,
      };
    }
  } else {
    // post-meal-2h or other
    if (value > 3) {
      return {
        level: 'level3a',
        reasonCode: 'postmeal-very-high',
        title: 'Glycémie post-prandiale très élevée',
        message: `Glycémie à ${v} g/L 2 h après un repas : largement au-dessus de la cible (< 1,40 g/L 2 h post-repas, source HAS).`,
        recommendation:
          'Recontrôle dans 15-30 minutes. Si la valeur reste très élevée ou si tu as des symptômes (nausées, haleine inhabituelle, soif intense), applique ton plan d’urgence et contacte ton médecin aujourd’hui.',
        sources: SOURCES_HAS_SFD,
      };
    }
    if (value > 2) {
      return {
        level: 'level1',
        reasonCode: 'postmeal-high',
        title: 'Glycémie post-prandiale élevée',
        message: `Glycémie à ${v} g/L 2 h après un repas, au-dessus de 2 g/L.`,
        recommendation:
          'Une valeur isolée peut s’expliquer par un repas plus riche ou moins d’activité. Si plusieurs valeurs > 2 g/L sur la semaine, contacte ton médecin.',
        sources: SOURCES_HAS_SFD,
      };
    }
    if (value > 1.4) {
      return {
        level: 'level1',
        reasonCode: 'postmeal-above-target',
        title: 'Glycémie post-prandiale légèrement élevée',
        message: `Glycémie à ${v} g/L 2 h après un repas, au-dessus de la cible usuelle (< 1,40 g/L, source HAS).`,
        recommendation:
          'Pas d’inquiétude pour une valeur isolée. Observe ce qui a changé (repas, activité, stress) et suis la tendance sur la semaine.',
        sources: SOURCES_HAS_SFD,
      };
    }
  }

  return {
    level: 'normal',
    reasonCode: 'in-target',
    title: 'Dans la cible',
    message: `Glycémie à ${v} g/L : dans l’objectif habituel.`,
    recommendation: 'Continue ton suivi régulier.',
    sources: SOURCES_HAS_SFD,
  };
}

export interface TendanceSummary {
  totalLast7Days: number;
  abnormalLast7Days: number;
  highValueCountLast7Days: number; // > 2 g/L
  highValueRepeatedAlertActive: boolean; // ≥ 3 readings > 2 g/L on 7 days → niveau 2
  maxLevelLast7Days: AlertLevel;
}

/**
 * Walk a list of measurements (already classified) and derive aggregate
 * surveillance signals for the past 7 days. Implements the §A.5 repetition
 * rule "plusieurs glycémies > 2 g/L sur la semaine → niveau 2".
 */
export function computeGlycemiaTendance(params: {
  classified: Array<{ measuredAt: string; value: number; level: AlertLevel }>;
  now?: Date;
}): TendanceSummary {
  const now = (params.now ?? new Date()).getTime();
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;

  let total = 0;
  let abnormal = 0;
  let highValueCount = 0;
  let maxLevel: AlertLevel = 'normal';

  for (const m of params.classified) {
    const t = new Date(m.measuredAt).getTime();
    if (Number.isNaN(t) || t < cutoff || t > now + 60_000) continue;
    total += 1;
    if (m.level !== 'normal') abnormal += 1;
    if (m.value > 2) highValueCount += 1;
    if (ALERT_LEVEL_RANK[m.level] > ALERT_LEVEL_RANK[maxLevel]) maxLevel = m.level;
  }

  // Repetition rule: 3+ readings > 2 g/L on a rolling week escalates to level 2.
  const highValueRepeatedAlertActive = highValueCount >= 3;
  if (highValueRepeatedAlertActive && ALERT_LEVEL_RANK.level2 > ALERT_LEVEL_RANK[maxLevel]) {
    maxLevel = 'level2';
  }

  return {
    totalLast7Days: total,
    abnormalLast7Days: abnormal,
    highValueCountLast7Days: highValueCount,
    highValueRepeatedAlertActive,
    maxLevelLast7Days: maxLevel,
  };
}
