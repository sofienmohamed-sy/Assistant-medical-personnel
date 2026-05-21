import { z } from 'zod';

// Personalised diabète T2 emergency plan, surfaced under critical glycémie
// alerts. Each field is optional — the user fills only what's relevant. The
// generic HAS template (§A.6) is always shown as a fallback in the UI; the
// personal plan is layered on top.

export const EMERGENCY_PLAN_SCENARIOS = ['hypoglycemia', 'hyperglycemia', 'acidocetose'] as const;
export type EmergencyPlanScenario = (typeof EMERGENCY_PLAN_SCENARIOS)[number];

const optionalShort = z
  .string()
  .trim()
  .max(200, 'Texte trop long (max 200 caractères).')
  .optional();
const optionalLong = z
  .string()
  .trim()
  .max(1000, 'Texte trop long (max 1000 caractères).')
  .optional();

export const diabeteEmergencyPlanSchema = z.object({
  // Hypoglycémie — what to do first when value < 0.7 g/L or warning symptoms.
  hypoSugarSource: optionalShort,
  hypoQuickContact: optionalShort,
  hypoNotes: optionalLong,

  // Hyperglycémie — recontrôle delay and who to call when value > seuil.
  hyperRecheckMinutes: z
    .number({ invalid_type_error: 'Valeur invalide.' })
    .int('Indique un nombre entier de minutes.')
    .min(5, 'Au moins 5 minutes.')
    .max(120, 'Au plus 120 minutes.')
    .optional(),
  hyperMedicalContact: optionalShort,
  hyperNotes: optionalLong,

  // Acidocétose / urgence vitale — emergency contact override (default 15).
  ketoEmergencyNumber: z
    .string()
    .trim()
    .max(20, 'Numéro trop long.')
    .regex(/^[0-9 +.-]*$/, 'Caractères autorisés : chiffres, +, espaces, points, tirets.')
    .optional(),
  ketoNearestEmergencyRoom: optionalShort,
  ketoNotes: optionalLong,
});

export type DiabeteEmergencyPlanInput = z.infer<typeof diabeteEmergencyPlanSchema>;

export interface StoredDiabeteEmergencyPlan extends DiabeteEmergencyPlanInput {
  updatedAt: Date;
}

// Hints used as <input> placeholders in the plan-urgence editor. They are
// deliberately framed as prompts ("ce que ton médecin te recommande de
// faire") rather than concrete therapeutic actions, since the app never
// prescribes treatment in its own voice (spec §2.1). The standard HAS
// protocol is reachable through the educational fiches, where it is
// presented as reference, not as a directive.
export const DIABETE_EMERGENCY_PLAN_HINTS_FR = {
  hypoSugarSource: 'L’action immédiate convenue avec ton médecin',
  hypoQuickContact: 'Un proche à appeler en cas de malaise',
  hyperRecheckMinutes: 15,
  hyperMedicalContact: 'Médecin traitant ou diabétologue',
  ketoEmergencyNumber: '15',
  ketoNearestEmergencyRoom: 'Service d’urgences le plus proche',
} as const;

// Backwards-compatible alias — kept until consumers migrate to the renamed
// constant. Same values.
export const DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS = DIABETE_EMERGENCY_PLAN_HINTS_FR;

/**
 * Pick the relevant slice of the plan for a given alert reason code.
 * Returns undefined if there is nothing user-personalised for that scenario.
 */
export function pickEmergencyPlanForReason(
  reasonCode: string,
  plan: DiabeteEmergencyPlanInput | null | undefined,
): { scenario: EmergencyPlanScenario; lines: Array<{ label: string; value: string }> } | undefined {
  if (!plan) return undefined;
  const lines: Array<{ label: string; value: string }> = [];

  if (reasonCode === 'severe-hypo' || reasonCode === 'hypo-resucrage') {
    if (plan.hypoSugarSource) lines.push({ label: 'Resucrage', value: plan.hypoSugarSource });
    if (plan.hypoQuickContact) lines.push({ label: 'Appel rapide', value: plan.hypoQuickContact });
    if (plan.hypoNotes) lines.push({ label: 'Notes', value: plan.hypoNotes });
    return lines.length ? { scenario: 'hypoglycemia', lines } : undefined;
  }
  if (
    reasonCode === 'fasting-very-high' ||
    reasonCode === 'postmeal-very-high' ||
    reasonCode === 'fasting-high' ||
    reasonCode === 'postmeal-high'
  ) {
    if (plan.hyperRecheckMinutes) {
      lines.push({ label: 'Recontrôle', value: `${plan.hyperRecheckMinutes} minutes` });
    }
    if (plan.hyperMedicalContact) {
      lines.push({ label: 'Contact médical', value: plan.hyperMedicalContact });
    }
    if (plan.hyperNotes) lines.push({ label: 'Notes', value: plan.hyperNotes });
    return lines.length ? { scenario: 'hyperglycemia', lines } : undefined;
  }
  if (reasonCode === 'severe-hyper') {
    if (plan.ketoEmergencyNumber) {
      lines.push({ label: 'Urgences', value: plan.ketoEmergencyNumber });
    }
    if (plan.ketoNearestEmergencyRoom) {
      lines.push({ label: 'Service d’urgence', value: plan.ketoNearestEmergencyRoom });
    }
    if (plan.ketoNotes) lines.push({ label: 'Notes', value: plan.ketoNotes });
    return lines.length ? { scenario: 'acidocetose', lines } : undefined;
  }
  return undefined;
}
