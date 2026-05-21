import { z } from 'zod';
import type { AlertLevel } from './alerts';
import type { DiabeteT2Profile } from './pathologies';

// Diabète T2 symptom catalog from design doc §A.4. Each symptom belongs to a
// clinical category; the triage engine combines categories with the user's
// treatment profile to compute a level. All codes kept stable across versions
// — they are persisted in Firestore and referenced by message templates.

export const DIABETE_SYMPTOM_CATEGORIES = [
  'hypo',
  'hyperChronic',
  'acidocetose',
  'severity',
] as const;
export type DiabeteSymptomCategory = (typeof DIABETE_SYMPTOM_CATEGORIES)[number];

// Hypoglycémie symptoms (§A.4 — alerte rouge chez patients sous insuline ou
// sulfamides; pour les profils A/B, ces signes sont rares mais possibles).
const HYPO_SYMPTOMS = [
  'hypo:sweats',
  'hypo:tremor',
  'hypo:palpitations',
  'hypo:sudden-hunger',
  'hypo:dizziness',
  'hypo:confusion',
  'hypo:irritability',
  'hypo:blurred-vision',
  'hypo:malaise',
  'hypo:peribuccal-numbness',
] as const;

// Hyperglycémie chronique (à surveiller en routine).
const HYPER_CHRONIC_SYMPTOMS = [
  'hyper:polydipsia',
  'hyper:polyuria',
  'hyper:fatigue',
  'hyper:blurred-vision',
  'hyper:slow-healing',
  'hyper:recurrent-infections',
  'hyper:weight-loss',
] as const;

// Acidocétose (alerte rouge).
const ACIDOCETOSE_SYMPTOMS = [
  'acido:nausea',
  'acido:vomiting',
  'acido:abdominal-pain',
  'acido:fruity-breath',
  'acido:kussmaul',
  'acido:somnolence',
  'acido:severe-dehydration',
  'acido:intense-thirst',
] as const;

// Signes de gravité hypoglycémique (urgence vitale).
const SEVERITY_SYMPTOMS = [
  'severity:consciousness-trouble',
  'severity:convulsions',
  'severity:loss-of-consciousness',
] as const;

export const DIABETE_SYMPTOM_CODES = [
  ...HYPO_SYMPTOMS,
  ...HYPER_CHRONIC_SYMPTOMS,
  ...ACIDOCETOSE_SYMPTOMS,
  ...SEVERITY_SYMPTOMS,
] as const;
export type DiabeteSymptomCode = (typeof DIABETE_SYMPTOM_CODES)[number];

export const DIABETE_SYMPTOM_LABELS_FR: Record<DiabeteSymptomCode, string> = {
  // Hypo
  'hypo:sweats': 'Sueurs froides, pâleur',
  'hypo:tremor': 'Tremblements',
  'hypo:palpitations': 'Palpitations, tachycardie',
  'hypo:sudden-hunger': 'Faim soudaine intense',
  'hypo:dizziness': 'Vertiges',
  'hypo:confusion': 'Confusion, difficulté de concentration',
  'hypo:irritability': 'Irritabilité inhabituelle',
  'hypo:blurred-vision': 'Vision trouble',
  'hypo:malaise': 'Sensation de malaise général',
  'hypo:peribuccal-numbness': 'Engourdissements autour de la bouche',
  // Hyper chronique
  'hyper:polydipsia': 'Soif inhabituelle',
  'hyper:polyuria': 'Mictions fréquentes',
  'hyper:fatigue': 'Fatigue inhabituelle',
  'hyper:blurred-vision': 'Vision floue persistante',
  'hyper:slow-healing': 'Plaies qui cicatrisent lentement',
  'hyper:recurrent-infections': 'Infections urinaires ou cutanées récurrentes',
  'hyper:weight-loss': 'Perte de poids inexpliquée',
  // Acidocétose
  'acido:nausea': 'Nausées',
  'acido:vomiting': 'Vomissements',
  'acido:abdominal-pain': 'Douleurs abdominales',
  'acido:fruity-breath': 'Haleine fruitée (« pomme reinette »)',
  'acido:kussmaul': 'Respiration rapide et profonde',
  'acido:somnolence': 'Somnolence inhabituelle',
  'acido:severe-dehydration': 'Déshydratation marquée',
  'acido:intense-thirst': 'Soif intense',
  // Gravité
  'severity:consciousness-trouble': 'Troubles de la conscience',
  'severity:convulsions': 'Convulsions',
  'severity:loss-of-consciousness': 'Perte de connaissance',
};

export const DIABETE_SYMPTOM_CATEGORY_LABELS_FR: Record<DiabeteSymptomCategory, string> = {
  hypo: 'Signes possibles d’hypoglycémie',
  hyperChronic: 'Signes d’hyperglycémie chronique',
  acidocetose: 'Signes possibles d’acidocétose',
  severity: 'Signes de gravité',
};

export function categoryOf(code: DiabeteSymptomCode): DiabeteSymptomCategory {
  if (code.startsWith('hypo:')) return 'hypo';
  if (code.startsWith('hyper:')) return 'hyperChronic';
  if (code.startsWith('acido:')) return 'acidocetose';
  return 'severity';
}

export function symptomsByCategory(): Record<DiabeteSymptomCategory, DiabeteSymptomCode[]> {
  return {
    hypo: [...HYPO_SYMPTOMS],
    hyperChronic: [...HYPER_CHRONIC_SYMPTOMS],
    acidocetose: [...ACIDOCETOSE_SYMPTOMS],
    severity: [...SEVERITY_SYMPTOMS],
  };
}

const isoDateTime = z
  .string()
  .min(1, 'Date et heure requises.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Date et heure invalides.',
  })
  .refine((value) => new Date(value).getTime() <= Date.now() + 60_000, {
    message: 'La date et l’heure ne peuvent pas être dans le futur.',
  });

export const diabeteSymptomReportSchema = z.object({
  pathologyType: z.literal('diabeteT2'),
  symptoms: z
    .array(z.enum(DIABETE_SYMPTOM_CODES, { errorMap: () => ({ message: 'Symptôme inconnu.' }) }))
    .min(1, 'Sélectionne au moins un symptôme.')
    .max(DIABETE_SYMPTOM_CODES.length, 'Trop de symptômes sélectionnés.'),
  reportedAt: isoDateTime,
  note: z.string().trim().max(500, 'Note trop longue (max 500 caractères).').optional(),
});
export type DiabeteSymptomReportInput = z.infer<typeof diabeteSymptomReportSchema>;

export interface StoredDiabeteSymptomReport extends DiabeteSymptomReportInput {
  id: string;
  createdAt: Date;
  reportedAt: string;
}

export interface SymptomTriageResult {
  level: AlertLevel;
  reasonCode: string;
  title: string;
  message: string;
  recommendation: string;
  nextActions: string[];
  sources: string[];
}

const SOURCES_HAS_SFD = ['HAS 2024 — Diabète de type 2', 'Société Francophone du Diabète'];

const HYPO_RISK_PROFILES: ReadonlySet<DiabeteT2Profile> = new Set(['C', 'D', 'E']);

/**
 * Triage a set of self-reported diabète T2 symptoms.
 *
 * Rules summary (see design doc §A.4 / §A.5 / §A.10):
 *   - Any "gravité" symptom (troubles de conscience / convulsions / coma)
 *     OR full acidocétose triad (kussmaul + nausea/vomiting + fruity breath)
 *     → level 3b, urgence vitale, appel du 15.
 *   - Acidocétose signs (≥ 2 in category) → level 3a, applique le plan
 *     d'urgence et contacte le médecin aujourd'hui.
 *   - Hypo signs:
 *       · ≥ 2 chez profil à risque (C/D/E) → level 3a, resucrage immédiat.
 *       · 1 chez profil à risque → level 2, mesure ta glycémie maintenant.
 *       · Chez profil A/B : level 1 (rare mais possible), encourage mesure.
 *   - Hyperglycémie chronique ≥ 3 symptômes → level 2, consulte le médecin.
 *   - 1-2 symptômes chroniques isolés → level 1, surveille.
 *   - Pas de symptôme classé → level normal (le formulaire impose au
 *     moins 1, donc cas marginal).
 *
 * All thresholds and messages cite HAS / SFD and are flagged as draft
 * pending medical validation per spec §2.6 / §14.
 */
export function computeDiabeteSymptomTriage(
  symptoms: DiabeteSymptomCode[],
  treatmentProfile: DiabeteT2Profile,
): SymptomTriageResult {
  const hasHypoRisk = HYPO_RISK_PROFILES.has(treatmentProfile);

  const hypoCount = symptoms.filter((s) => s.startsWith('hypo:')).length;
  const hyperCount = symptoms.filter((s) => s.startsWith('hyper:')).length;
  const acidoCount = symptoms.filter((s) => s.startsWith('acido:')).length;
  const severityCount = symptoms.filter((s) => s.startsWith('severity:')).length;
  const hasFruityBreath = symptoms.includes('acido:fruity-breath');
  const hasKussmaul = symptoms.includes('acido:kussmaul');
  const hasNauseaOrVomit = symptoms.includes('acido:nausea') || symptoms.includes('acido:vomiting');

  // --- Level 3b — urgence vitale -----------------------------------------
  if (severityCount > 0) {
    return {
      level: 'level3b',
      reasonCode: 'symptom-severity',
      title: 'Urgence vitale — trouble de conscience',
      message:
        'Les signes que tu décris (trouble de conscience, convulsions ou perte de connaissance) sont des urgences vitales.',
      recommendation:
        'Appelle le 15 immédiatement. Si tu es seul·e, mets-toi en position latérale de sécurité si possible.',
      nextActions: [
        'Appelle le 15.',
        'Ne mange ni ne bois rien si tu es somnolent·e.',
        'Préviens un proche.',
      ],
      sources: SOURCES_HAS_SFD,
    };
  }
  if (hasFruityBreath && hasKussmaul && hasNauseaOrVomit) {
    return {
      level: 'level3b',
      reasonCode: 'symptom-acidocetose-severe',
      title: 'Urgence vitale — acidocétose probable',
      message:
        'L’association haleine fruitée + respiration rapide + nausées ou vomissements évoque une décompensation acidocétosique.',
      recommendation:
        'Appelle le 15 immédiatement. Applique ton plan d’urgence acidocétose en attendant les secours.',
      nextActions: [
        'Appelle le 15.',
        'Mesure ta glycémie si tu peux.',
        'Hydrate-toi à petites gorgées si tu n’es pas somnolent·e.',
      ],
      sources: SOURCES_HAS_SFD,
    };
  }

  // --- Level 3a — urgence relative ---------------------------------------
  if (acidoCount >= 2) {
    return {
      level: 'level3a',
      reasonCode: 'symptom-acidocetose-suspected',
      title: 'Signes possibles d’acidocétose',
      message:
        'Plusieurs signes évoquent une acidocétose : suis ces conseils en priorité et contacte ton médecin aujourd’hui.',
      recommendation:
        'Mesure ta glycémie maintenant. Si tu as accès à des bandelettes urinaires, vérifie la présence de corps cétoniques. Hydrate-toi à petites gorgées. Contacte ton médecin ou le 15 si les signes s’aggravent.',
      nextActions: [
        'Mesure ta glycémie.',
        'Bois de l’eau régulièrement.',
        'Contacte ton médecin aujourd’hui ; le 15 si aggravation.',
      ],
      sources: SOURCES_HAS_SFD,
    };
  }
  if (hasHypoRisk && hypoCount >= 2) {
    return {
      level: 'level3a',
      reasonCode: 'symptom-hypo-multi',
      title: 'Hypoglycémie probable — resucrage immédiat',
      message:
        'Plusieurs signes d’hypoglycémie chez un patient sous traitement à risque. À traiter sans délai.',
      recommendation:
        'Prends 15 g de sucre rapide (3 morceaux, 1 verre de jus de fruit). Reste assis·e, recontrôle ta glycémie dans 15 minutes. Si toujours bas après 2 resucrages : appelle le 15 ou ton médecin.',
      nextActions: [
        'Resucre-toi maintenant (15 g de sucre rapide).',
        'Reste assis·e, ne conduis pas.',
        'Mesure ta glycémie si tu peux.',
        'Recontrôle dans 15 minutes.',
      ],
      sources: SOURCES_HAS_SFD,
    };
  }

  // --- Level 2 — à surveiller, voir le médecin ---------------------------
  if (hasHypoRisk && hypoCount === 1) {
    return {
      level: 'level2',
      reasonCode: 'symptom-hypo-single',
      title: 'Signe possible d’hypoglycémie',
      message:
        'Un signe évoquant une hypoglycémie chez un patient sous traitement à risque. À vérifier sans attendre.',
      recommendation:
        'Mesure ta glycémie maintenant. Si < 0,70 g/L, applique ton plan d’urgence resucrage. Si normal, surveille la prochaine heure.',
      nextActions: ['Mesure ta glycémie maintenant.', 'Garde du sucre rapide à portée.'],
      sources: SOURCES_HAS_SFD,
    };
  }
  if (hyperCount >= 3) {
    return {
      level: 'level2',
      reasonCode: 'symptom-hyper-chronic-multi',
      title: 'Plusieurs signes d’hyperglycémie chronique',
      message:
        'Plusieurs signes d’hyperglycémie chronique en même temps. Cela mérite d’en parler avec ton médecin cette semaine.',
      recommendation:
        'Mesure ta glycémie pour préciser. Note l’évolution sur quelques jours. Contacte ton médecin dans la semaine pour faire le point.',
      nextActions: ['Mesure ta glycémie.', 'Prends rendez-vous avec ton médecin cette semaine.'],
      sources: SOURCES_HAS_SFD,
    };
  }
  if (acidoCount === 1) {
    return {
      level: 'level2',
      reasonCode: 'symptom-acidocetose-isolated',
      title: 'Signe isolé évoquant une acidocétose',
      message: 'Un signe isolé évoquant une acidocétose. Surveille de près et mesure ta glycémie.',
      recommendation:
        'Mesure ta glycémie maintenant. Si > 2,5 g/L ou si d’autres signes apparaissent (nausées, haleine inhabituelle, respiration rapide), contacte ton médecin ou le 15.',
      nextActions: [
        'Mesure ta glycémie.',
        'Note les signes et leur évolution.',
        'Contacte ton médecin si la glycémie dépasse la cible.',
      ],
      sources: SOURCES_HAS_SFD,
    };
  }

  // --- Level 1 — information / surveille --------------------------------
  if (hypoCount >= 1) {
    return {
      level: 'level1',
      reasonCode: 'symptom-hypo-low-risk',
      title: 'Sensation possible d’hypoglycémie',
      message:
        'Tu décris un signe évocateur d’hypoglycémie. Ton traitement n’expose pas à un risque marqué, mais une mesure permet de lever le doute.',
      recommendation:
        'Mesure ta glycémie si tu peux. Hydrate-toi, prends une collation si tu n’as rien mangé depuis longtemps.',
      nextActions: [
        'Mesure ta glycémie.',
        'Si la sensation persiste plus de 30 minutes, parle-en à ton médecin.',
      ],
      sources: SOURCES_HAS_SFD,
    };
  }
  if (hyperCount >= 1) {
    return {
      level: 'level1',
      reasonCode: 'symptom-hyper-chronic-single',
      title: 'Signe isolé d’hyperglycémie chronique',
      message:
        'Un seul signe d’hyperglycémie chronique. Une explication non médicale est possible (sommeil, stress).',
      recommendation:
        'Surveille la prochaine semaine. Si le signe revient ou si d’autres s’ajoutent, contacte ton médecin.',
      nextActions: ['Mesure ta glycémie cette semaine.', 'Note les signes et leur évolution.'],
      sources: SOURCES_HAS_SFD,
    };
  }

  return {
    level: 'normal',
    reasonCode: 'symptom-none',
    title: 'Pas de signal clinique pour l’instant',
    message: 'Les éléments sélectionnés ne correspondent pas à un signal d’alerte particulier.',
    recommendation:
      'Continue ton suivi régulier. Si tu te sens vraiment mal, mesure ta glycémie ou appelle ton médecin.',
    nextActions: ['Mesure ta glycémie pour confirmer.'],
    sources: SOURCES_HAS_SFD,
  };
}
