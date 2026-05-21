import { z } from 'zod';

// Pathology identifiers — kept stable across versions; v1 covers the three
// pathologies enumerated in design document §4.4.
export const PATHOLOGY_TYPES = ['diabeteT2', 'hta', 'asthme'] as const;
export type PathologyType = (typeof PATHOLOGY_TYPES)[number];

export const PATHOLOGY_LABELS_FR: Record<PathologyType, string> = {
  diabeteT2: 'Diabète de type 2',
  hta: 'Hypertension artérielle',
  asthme: 'Asthme',
};

export const PATHOLOGY_DESCRIPTIONS_FR: Record<PathologyType, string> = {
  diabeteT2: 'Suivi de la glycémie, de l’HbA1c estimée et des signaux d’hypo/hyperglycémie.',
  hta: 'Suivi de la tension artérielle en automesure et alertes en cas de pic.',
  asthme: 'Suivi du contrôle GINA, de l’usage du bronchodilatateur et des exacerbations.',
};

// Diabète T2 profiles — design doc §A.3.
export const DIABETE_T2_PROFILES = ['A', 'B', 'C', 'D', 'E'] as const;
export type DiabeteT2Profile = (typeof DIABETE_T2_PROFILES)[number];

export const DIABETE_T2_PROFILE_LABELS_FR: Record<DiabeteT2Profile, string> = {
  A: 'Hygiéno-diététique seul',
  B: 'Antidiabétiques oraux sans risque d’hypoglycémie (Metformine, iSGLT2, GLP-1)',
  C: 'Antidiabétiques oraux avec risque d’hypoglycémie (sulfamides, glinides)',
  D: 'Insuline basale (lente seule)',
  E: 'Insuline basal-bolus (lente + rapide aux repas)',
};

// Hypertension treatment level — design doc §B + ESC 2024.
export const HTA_PROFILES = [
  'untreated',
  'monotherapie',
  'bitherapie',
  'tritherapie',
  'resistante',
] as const;
export type HtaProfile = (typeof HTA_PROFILES)[number];

export const HTA_PROFILE_LABELS_FR: Record<HtaProfile, string> = {
  untreated: 'Non traité (sous surveillance)',
  monotherapie: 'Monothérapie',
  bitherapie: 'Bithérapie',
  tritherapie: 'Trithérapie',
  resistante: 'HTA résistante (≥ 3 antihypertenseurs + ARM)',
};

// Asthme treatment step — GINA 2024 paliers, design doc §C.
export const ASTHME_PROFILES = ['palier1', 'palier2', 'palier3', 'palier4', 'palier5'] as const;
export type AsthmeProfile = (typeof ASTHME_PROFILES)[number];

export const ASTHME_PROFILE_LABELS_FR: Record<AsthmeProfile, string> = {
  palier1: 'Palier 1 — CSI + formotérol à la demande',
  palier2: 'Palier 2 — CSI faible-dose quotidien',
  palier3: 'Palier 3 — CSI faible-dose + LABA quotidiens',
  palier4: 'Palier 4 — CSI moyenne-dose + LABA (± LAMA)',
  palier5: 'Palier 5 — Suivi spécialisé (biothérapie, corticoïdes oraux)',
};

const isoDateTimeOrEmpty = z
  .string()
  .min(1, 'Date invalide.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Date invalide.' })
  .optional();

const diabeteActivationSchema = z.object({
  type: z.literal('diabeteT2'),
  treatmentProfile: z.enum(DIABETE_T2_PROFILES, {
    errorMap: () => ({ message: 'Choisis un profil de traitement.' }),
  }),
  diagnosedAt: isoDateTimeOrEmpty,
});

const htaActivationSchema = z.object({
  type: z.literal('hta'),
  treatmentProfile: z.enum(HTA_PROFILES, {
    errorMap: () => ({ message: 'Choisis un niveau de traitement.' }),
  }),
  diagnosedAt: isoDateTimeOrEmpty,
});

const asthmeActivationSchema = z.object({
  type: z.literal('asthme'),
  treatmentProfile: z.enum(ASTHME_PROFILES, {
    errorMap: () => ({ message: 'Choisis un palier GINA.' }),
  }),
  diagnosedAt: isoDateTimeOrEmpty,
});

export const pathologyActivationSchema = z.discriminatedUnion('type', [
  diabeteActivationSchema,
  htaActivationSchema,
  asthmeActivationSchema,
]);
export type PathologyActivation = z.infer<typeof pathologyActivationSchema>;

// The full form: which pathologies are active + the chosen profile for each.
// All three are optional — a healthy user (or a parent managing family) submits
// the form with none selected; the act of submitting still flags pathologies
// as reviewed so the app stops nagging.
export const pathologiesFormSchema = z.object({
  diabeteT2: diabeteActivationSchema.omit({ type: true }).optional(),
  hta: htaActivationSchema.omit({ type: true }).optional(),
  asthme: asthmeActivationSchema.omit({ type: true }).optional(),
});
export type PathologiesFormInput = z.infer<typeof pathologiesFormSchema>;

// Storage shape on the user doc.
export interface ActivePathologies {
  diabeteT2?: { treatmentProfile: DiabeteT2Profile; addedAt: Date };
  hta?: { treatmentProfile: HtaProfile; addedAt: Date };
  asthme?: { treatmentProfile: AsthmeProfile; addedAt: Date };
}
