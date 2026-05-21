import { describe, it } from 'vitest';
import {
  computeDiabeteSymptomTriage,
  computeGlycemiaAlert,
  DIABETE_SYMPTOM_CODES,
  GLYCEMIA_MOMENTS,
  type DiabeteSymptomCode,
  type GlycemiaMoment,
} from '@shared/index';
import type { DiabeteT2Profile } from '@shared/pathologies';

// Spec §2.1: "L'app suggère. L'app ne touche jamais à la thérapeutique."
//
// This test sweeps every alert / triage output the engines can produce and
// asserts that none of the user-facing strings (title, message,
// recommendation, nextActions) prescribes a specific therapeutic action.
//
// What's forbidden — the app prescribing in its own voice:
//   - "Prends X g de sucre"
//   - "Resucre-toi"
//   - "15 g de sucre rapide" as an instruction
//   - "Garde du sucre rapide à portée" (still nudging a treatment habit)
//
// What's allowed in the engines' voice:
//   - "Consulte ton plan d'urgence personnel"
//   - "Mesure ta glycémie"
//   - "Reste assis·e, ne conduis pas" (safety, not therapy)
//   - "Appelle le 15", "Contacte ton médecin" (routing, not therapy)
//   - References to "0,70 g/L" as a clinical threshold (informational)
//   - The word "resucrage" inside an internal reason code is fine — it's not
//     user-facing.

// Phrases that, if any user-facing string contains them (case-insensitive),
// indicate the engine is prescribing a treatment.
const FORBIDDEN_PHRASES: ReadonlyArray<{ phrase: RegExp; why: string }> = [
  { phrase: /\bresucre[- ]?toi\b/i, why: 'imperative "resucre-toi" prescribes therapy' },
  { phrase: /\bprends? \d+ ?g de sucre/i, why: 'prescribes a sugar dose' },
  { phrase: /\bprends? un ?morceau /i, why: 'prescribes ingestion' },
  {
    phrase: /\bgard(e|er)\b[^.]*\bsucre rapide\b/i,
    why: 'tells the patient to carry a specific treatment',
  },
];

// Strings allowed to mention "sucre rapide" / "morceaux de sucre" etc. as
// pure references (e.g. inside a fiche's descriptive HAS reference). We don't
// scan those here — only the active alert / triage engines.

function userFacingStrings(obj: {
  title: string;
  message: string;
  recommendation: string;
  nextActions?: string[];
}): string[] {
  return [obj.title, obj.message, obj.recommendation, ...(obj.nextActions ?? [])];
}

function assertNoTreatmentPrescription(strings: string[], context: string) {
  for (const s of strings) {
    for (const { phrase, why } of FORBIDDEN_PHRASES) {
      if (phrase.test(s)) {
        throw new Error(
          `Treatment prescription detected in ${context}: "${s}" matches /${phrase.source}/ (${why})`,
        );
      }
    }
  }
}

const PROFILES: ReadonlyArray<DiabeteT2Profile> = ['A', 'B', 'C', 'D', 'E'];

describe('No-treatment-prescription rule (spec §2.1)', () => {
  it('computeGlycemiaAlert never prescribes a treatment, across all profiles × moments × representative values', () => {
    // Sweep a grid of representative values that hit every branch:
    // severe hypo, hypo zone, in-target, mild-high, very-high, severe hyper.
    const values = [0.3, 0.55, 0.65, 0.95, 1.2, 1.7, 2.1, 2.8, 3.4, 4.0];
    for (const profile of PROFILES) {
      for (const moment of GLYCEMIA_MOMENTS) {
        for (const value of values) {
          const alert = computeGlycemiaAlert({ value, moment: moment as GlycemiaMoment }, profile);
          assertNoTreatmentPrescription(
            userFacingStrings({ ...alert, nextActions: [] }),
            `computeGlycemiaAlert(value=${value}, moment=${moment}, profile=${profile}) → ${alert.reasonCode}`,
          );
        }
      }
    }
  });

  it('computeDiabeteSymptomTriage never prescribes a treatment across the full symptom catalog', () => {
    // Representative combinations per branch in the triage engine.
    const combos: DiabeteSymptomCode[][] = [
      ['severity:loss-of-consciousness'],
      ['acido:kussmaul', 'acido:nausea', 'acido:fruity-breath'],
      ['acido:nausea', 'acido:abdominal-pain'],
      ['acido:fruity-breath'],
      ['hypo:sweats', 'hypo:tremor'],
      ['hypo:dizziness'],
      ['hyper:polydipsia', 'hyper:polyuria', 'hyper:fatigue'],
      ['hyper:fatigue'],
    ];
    for (const profile of PROFILES) {
      for (const combo of combos) {
        const triage = computeDiabeteSymptomTriage(combo, profile);
        assertNoTreatmentPrescription(
          userFacingStrings(triage),
          `computeDiabeteSymptomTriage(${combo.join('+')}, profile=${profile}) → ${triage.reasonCode}`,
        );
      }
    }
  });

  it('every single symptom code triggers an engine output free of treatment prescription', () => {
    for (const profile of PROFILES) {
      for (const code of DIABETE_SYMPTOM_CODES) {
        const triage = computeDiabeteSymptomTriage([code], profile);
        assertNoTreatmentPrescription(
          userFacingStrings(triage),
          `single ${code} at profile ${profile}`,
        );
      }
    }
  });
});
