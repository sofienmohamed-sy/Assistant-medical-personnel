import { z } from 'zod';

// Generic measurement type discriminator. v1 only ships glycémie; HTA
// automesure and asthme SABA counts come in follow-up PRs.
export const MEASUREMENT_TYPES = ['glycemia'] as const;
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
