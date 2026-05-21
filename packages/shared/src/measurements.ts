import { z } from 'zod';

// Generic measurement type discriminator. v1 covers glycémie and HbA1c for
// diabète T2. HTA automesure and asthme SABA counts come later (out of
// scope per the current session's web-only / diabète-only rule).
export const MEASUREMENT_TYPES = ['glycemia', 'hba1c'] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

// Glycémie measurement context. The "moment" drives which clinical threshold
// applies (design doc §A.2 / §A.5). Keep the codes stable across versions —
// they're persisted in Firestore.
export const GLYCEMIA_MOMENTS = [
  'fasting',
  'pre-meal',
  'post-meal-2h',
  'bedtime',
  'other',
] as const;
export type GlycemiaMoment = (typeof GLYCEMIA_MOMENTS)[number];

export const GLYCEMIA_MOMENT_LABELS_FR: Record<GlycemiaMoment, string> = {
  fasting: 'À jeun',
  'pre-meal': 'Avant un repas',
  'post-meal-2h': '2 h après un repas',
  bedtime: 'Au coucher',
  other: 'Autre moment',
};

// Plausible self-measurement range — we accept anything between 0.10 g/L (sub-
// lethal hypo) and 10.00 g/L (extreme hyper). Clinical alert thresholds (e.g.
// <0.7 = resucrage, >3 = urgence) live in the surveillance layer, not here.
const MIN_GLYCEMIA_G_PER_L = 0.1;
const MAX_GLYCEMIA_G_PER_L = 10;

const isoDateTime = z
  .string()
  .min(1, 'Date et heure requises.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Date et heure invalides.',
  })
  .refine((value) => new Date(value).getTime() <= Date.now() + 60_000, {
    message: 'La date et l’heure ne peuvent pas être dans le futur.',
  });

export const glycemiaMeasurementSchema = z.object({
  pathologyType: z.literal('diabeteT2'),
  measurementType: z.literal('glycemia'),
  value: z
    .number({ invalid_type_error: 'Valeur invalide.' })
    .finite('Valeur invalide.')
    .min(MIN_GLYCEMIA_G_PER_L, `Valeur trop basse (min ${MIN_GLYCEMIA_G_PER_L} g/L).`)
    .max(MAX_GLYCEMIA_G_PER_L, `Valeur trop haute (max ${MAX_GLYCEMIA_G_PER_L} g/L).`),
  unit: z.literal('g/L'),
  moment: z.enum(GLYCEMIA_MOMENTS, {
    errorMap: () => ({ message: 'Choisis le contexte de la mesure.' }),
  }),
  measuredAt: isoDateTime,
  note: z.string().trim().max(500, 'Note trop longue (max 500 caractères).').optional(),
});
export type GlycemiaMeasurementInput = z.infer<typeof glycemiaMeasurementSchema>;

export interface StoredMeasurement extends GlycemiaMeasurementInput {
  id: string;
  createdAt: Date;
  measuredAt: string;
}

export const GLYCEMIA_MIN = MIN_GLYCEMIA_G_PER_L;
export const GLYCEMIA_MAX = MAX_GLYCEMIA_G_PER_L;

// ---------------------------------------------------------------------------
// HbA1c (lab result, % units)
// ---------------------------------------------------------------------------
//
// Per design doc §A.2:
//   - HbA1c population non-diabétique : < 5,7 %
//   - Cible diabète T2 standard : < 7 %
//   - Cible diabète T2 récent, sans antécédents CV, espérance vie > 15 ans : ≤ 6,5 %
//   - Cible personne âgée fragile / antécédents CV : ≤ 8 %
// The personal target is set by the user's doctor — we don't recommend one,
// we just let the user record it for context.

const MIN_HBA1C_PERCENT = 4; // implausibly low
const MAX_HBA1C_PERCENT = 20; // very severe / lab error territory

export const HBA1C_MIN = MIN_HBA1C_PERCENT;
export const HBA1C_MAX = MAX_HBA1C_PERCENT;

export const hba1cMeasurementSchema = z.object({
  pathologyType: z.literal('diabeteT2'),
  measurementType: z.literal('hba1c'),
  value: z
    .number({ invalid_type_error: 'Valeur invalide.' })
    .finite('Valeur invalide.')
    .min(MIN_HBA1C_PERCENT, `Valeur trop basse (min ${MIN_HBA1C_PERCENT} %).`)
    .max(MAX_HBA1C_PERCENT, `Valeur trop haute (max ${MAX_HBA1C_PERCENT} %).`),
  unit: z.literal('%'),
  measuredAt: isoDateTime,
  labName: z
    .string()
    .trim()
    .max(100, 'Nom du laboratoire trop long (max 100 caractères).')
    .optional(),
  note: z.string().trim().max(500, 'Note trop longue (max 500 caractères).').optional(),
});
export type HbA1cMeasurementInput = z.infer<typeof hba1cMeasurementSchema>;

export interface StoredHbA1cMeasurement extends HbA1cMeasurementInput {
  id: string;
  createdAt: Date;
  measuredAt: string;
}

/**
 * Classify an HbA1c reading against the user's personal target. The
 * categories below are descriptive, not prescriptive — they explain how
 * the new value compares to the target, never tell the user what to do
 * about it. The personal target itself is set by the user (defaults are
 * empty: we never recommend a specific target).
 */
export type HbA1cBucket =
  | 'below-target'
  | 'at-target'
  | 'above-target'
  | 'far-above-target'
  | 'unknown';

export const HBA1C_BUCKET_LABELS_FR: Record<HbA1cBucket, string> = {
  'below-target': 'Sous ta cible',
  'at-target': 'Dans ta cible',
  'above-target': 'Au-dessus de ta cible',
  'far-above-target': 'Nettement au-dessus de ta cible',
  unknown: 'Pas encore de cible définie',
};

export function classifyHbA1c(
  value: number,
  personalTargetPercent: number | null | undefined,
): HbA1cBucket {
  if (personalTargetPercent == null) return 'unknown';
  // 0.5 % of headroom around the target ≈ the variability of a routine lab
  // — anything within that band is "at-target".
  if (value < personalTargetPercent - 0.5) return 'below-target';
  if (value <= personalTargetPercent) return 'at-target';
  if (value <= personalTargetPercent + 1.5) return 'above-target';
  return 'far-above-target';
}
