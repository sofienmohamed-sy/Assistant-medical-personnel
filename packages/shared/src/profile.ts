import { z } from 'zod';

export const COUNTRY_CODES = [
  'FR',
  'BE',
  'CH',
  'LU',
  'MC',
  'CA',
  'DE',
  'IT',
  'ES',
  'PT',
  'NL',
  'GB',
  'IE',
  'US',
  'MA',
  'DZ',
  'TN',
  'SN',
  'CI',
  'CM',
  'ML',
  'MG',
  'OTHER',
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export const COUNTRY_LABELS_FR: Record<CountryCode, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
  MC: 'Monaco',
  CA: 'Canada',
  DE: 'Allemagne',
  IT: 'Italie',
  ES: 'Espagne',
  PT: 'Portugal',
  NL: 'Pays-Bas',
  GB: 'Royaume-Uni',
  IE: 'Irlande',
  US: 'États-Unis',
  MA: 'Maroc',
  DZ: 'Algérie',
  TN: 'Tunisie',
  SN: 'Sénégal',
  CI: 'Côte d’Ivoire',
  CM: 'Cameroun',
  ML: 'Mali',
  MG: 'Madagascar',
  OTHER: 'Autre',
};

const NAME_MAX = 60;
const PROFESSION_MAX = 100;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : AAAA-MM-JJ).')
  .refine(
    (value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      const min = new Date('1900-01-01');
      return d >= min && d <= today;
    },
    { message: 'La date de naissance doit être entre 1900 et aujourd’hui.' },
  );

export const patientProfileSchema = z.object({
  prenom: z
    .string()
    .trim()
    .min(1, 'Prénom requis.')
    .max(NAME_MAX, `Prénom trop long (max ${NAME_MAX} caractères).`),
  nom: z
    .string()
    .trim()
    .min(1, 'Nom requis.')
    .max(NAME_MAX, `Nom trop long (max ${NAME_MAX} caractères).`),
  dateOfBirth: isoDate,
  countryOfResidence: z.enum(COUNTRY_CODES, {
    errorMap: () => ({ message: 'Pays de résidence requis.' }),
  }),
  countryOfOrigin: z.enum(COUNTRY_CODES, {
    errorMap: () => ({ message: 'Pays d’origine requis.' }),
  }),
  profession: z
    .string()
    .trim()
    .min(1, 'Profession requise.')
    .max(PROFESSION_MAX, `Profession trop longue (max ${PROFESSION_MAX} caractères).`),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;

export interface PatientProfile extends PatientProfileInput {
  uid: string;
  createdAt: Date;
  updatedAt: Date;
}
