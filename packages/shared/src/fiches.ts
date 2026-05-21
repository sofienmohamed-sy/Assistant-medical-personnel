// Educational fiches per design doc §2.7 (principe de transparence pédagogique)
// and §A.11 example fiches. The content below is compiled from public HAS,
// SFD and INSERM sources cited in the annexes. Like every clinical content
// shipped by this app, these MUST be reviewed by a medical professional
// before going to production (spec §2.6 + §14).
//
// Editorial principles applied:
//   - factual (no dramatisation)
//   - vulgarised (no jargon without translation)
//   - multi-causal (always several hypotheses, not just one)
//   - balanced (reassuring when reassuring, firm when serious)
//   - sourced (every section has its citations)

export interface FicheSection {
  question: string;
  /** Plain-text paragraphs separated by blank lines. */
  body: string;
}

export interface Fiche {
  id: string;
  title: string;
  /** One-line tagline rendered next to the disclosure trigger. */
  tagline: string;
  sections: FicheSection[];
  sources: string[];
}

const SOURCES_HAS_SFD = [
  'HAS — Stratégie thérapeutique du patient vivant avec un diabète de type 2, mai 2024',
  'Société Francophone du Diabète (SFD)',
  'INSERM — Dossier diabète',
];

const SOURCES_HAS_FFD = [
  'HAS — Diabète de type 2, mai 2024',
  'Fédération Française des Diabétiques',
];

export const FICHES: Record<string, Fiche> = {
  // §A.11.1 — adapted from the design doc, slightly tightened.
  'glycemia-postmeal-high': {
    id: 'glycemia-postmeal-high',
    title: 'Comprendre une glycémie post-prandiale élevée',
    tagline: 'Pourquoi 1,40 g/L est la cible 2 h après un repas et ce qui peut la dépasser.',
    sections: [
      {
        question: 'Que signifie une glycémie élevée 2 h après un repas ?',
        body: `Après un repas, ta glycémie monte naturellement le temps que l’insuline ramène le sucre dans les cellules. La cible recommandée 2 h après le début du repas est inférieure à 1,40 g/L : c’est le seuil qui limite les complications à long terme.

Au-delà, on parle d’hyperglycémie post-prandiale. Une valeur isolée n’a pas la même signification qu’une tendance répétée.`,
      },
      {
        question: 'Pourquoi cette cible de 1,40 g/L ?',
        body: `Plus la glycémie reste élevée régulièrement après les repas, plus l’HbA1c (la moyenne sur 3 mois) monte. L’HbA1c est le marqueur principal du risque de complications sur les yeux, les reins, les nerfs et le cœur. Maintenir les valeurs post-prandiales sous 1,40 g/L aide à garder l’HbA1c dans la cible personnalisée par ton médecin (souvent < 7 %).`,
      },
      {
        question: 'Les différents cas possibles',
        body: `• Repas plus riche en glucides que d’habitude → pic isolé, sans conséquence si rare.
• Aliments à index glycémique élevé (pain blanc, riz blanc, jus sucré) → élévation rapide attendue.
• Stress ou maladie en cours → le stress et les infections élèvent transitoirement la glycémie.
• Médicament pris en retard ou oublié → vérifie ton observance.
• Activité physique réduite par rapport à d’habitude → moins de glucose consommé par les muscles.
• Évolution de la maladie → si la valeur élevée devient récurrente, ton traitement peut nécessiter un ajustement (à voir avec ton médecin).`,
      },
      {
        question: 'Quand s’inquiéter et quand ne pas s’inquiéter',
        body: `Une valeur isolée entre 1,40 et 2 g/L n’est pas grave en soi. Plusieurs valeurs au-dessus de 2 g/L sur une semaine méritent d’en parler à ton médecin.

Au-dessus de 3 g/L, surtout avec des symptômes (soif intense, nausées, vomissements, haleine inhabituelle), c’est une urgence : applique ton plan d’urgence et contacte ton médecin aujourd’hui — ou appelle le 15 si les signes sont marqués.`,
      },
    ],
    sources: SOURCES_HAS_SFD,
  },

  // §A.11.3 — reframed in descriptive mood. The app never prescribes a
  // treatment in its own voice (spec §2.1); the educational card describes
  // the standard HAS protocol as reference and routes the user to their
  // own plan d'urgence personnel.
  'glycemia-hypoglycemia': {
    id: 'glycemia-hypoglycemia',
    title: 'Comprendre une hypoglycémie',
    tagline: 'Pourquoi 0,70 g/L est un seuil clé et où en parler avec ton médecin.',
    sections: [
      {
        question: 'Qu’est-ce qu’une hypoglycémie ?',
        body: `Une hypoglycémie est une glycémie trop basse, généralement en-dessous de 0,70 g/L. Le cerveau a besoin de sucre pour fonctionner ; quand il en manque, les symptômes apparaissent rapidement : sueurs, tremblements, palpitations, faim soudaine, vision trouble, irritabilité, difficultés de concentration.

Elle concerne surtout les patients sous insuline ou sous sulfamides hypoglycémiants. Pour un traitement par Metformine ou iSGLT2 seul, le risque est très faible.`,
      },
      {
        question: 'Pourquoi survient-elle ?',
        body: `Causes les plus fréquentes :
• Dose de médicament trop forte par rapport au repas qui suit.
• Repas sauté, retardé ou trop léger en glucides.
• Activité physique non prévue ou inhabituellement intense.
• Alcool à jeun (effet retardé, parfois plusieurs heures après).
• Erreur de dosage de l’insuline.
• Insuffisance rénale ou hépatique qui prolonge l’effet de certains médicaments.`,
      },
      {
        question: 'Les différents niveaux',
        body: `• Modérée (0,50 – 0,70 g/L) : sueurs, tremblements, faim, palpitations. Reste consciente·e et capable d’agir.
• Sévère (< 0,50 g/L) : confusion, vision floue, difficultés à agir. L’aide d’un proche peut être nécessaire.
• Très sévère : troubles de la conscience, convulsions, coma. C’est une urgence vitale — appelle le 15.`,
      },
      {
        question: 'Le modèle HAS de référence',
        body: `À titre informatif — les étapes ci-dessous décrivent le protocole HAS standard. Elles ne remplacent pas un plan d’urgence personnel construit avec ton médecin (qui prend en compte ton traitement, ton entourage et ton environnement).

Le protocole HAS standard prévoit :
1) Une prise immédiate de 15 g de sucre rapide (équivalents : 3 morceaux de sucre, un verre de jus de fruit, une cuillère à soupe de miel).
2) Repos — pas de conduite, pas d’effort.
3) Recontrôle de la glycémie à 15 minutes.
4) Une nouvelle prise si la glycémie reste sous 0,70 g/L.
5) En cas de doute, de signes inhabituels, ou si la valeur reste basse après deux prises : appel du 15 ou du médecin.
6) Après normalisation, une collation à index glycémique bas (pain + fromage, par exemple) pour stabiliser.
7) Noter l’épisode pour en parler en consultation.

Construis ton plan d’urgence personnel à partir de ces étapes en les adaptant avec ton médecin.`,
      },
      {
        question: 'Comment limiter le risque de récurrence',
        body: `• Respecte les horaires de prise de médicament et de repas.
• Discute avec ton médecin de l’organisation à avoir quand une activité physique est prévue.
• Si les épisodes se répètent, parle-en à ton médecin : c’est un signal que ta prise en charge peut être à revoir.`,
      },
    ],
    sources: SOURCES_HAS_FFD,
  },

  'glycemia-fasting-high': {
    id: 'glycemia-fasting-high',
    title: 'Comprendre une glycémie à jeun élevée',
    tagline: 'Pourquoi 1,10 g/L est la cible à jeun et ce qui peut la dépasser.',
    sections: [
      {
        question: 'Que signifie une glycémie élevée à jeun ?',
        body: `À jeun (au moins 8 h après le dernier repas, généralement le matin avant le petit-déjeuner), la glycémie reflète principalement la production de sucre par le foie pendant la nuit. La cible recommandée est < 1,10 g/L. Une valeur au-dessus indique que ton organisme a produit ou n’a pas suffisamment utilisé son sucre nocturne.`,
      },
      {
        question: 'Pourquoi cette cible ?',
        body: `Une glycémie à jeun durablement élevée pèse beaucoup dans la moyenne sur 3 mois (HbA1c). Maintenir le matin sous 1,10 g/L est un des leviers principaux pour atteindre la cible HbA1c personnalisée par ton médecin.`,
      },
      {
        question: 'Les différents cas possibles',
        body: `• Repas du soir tardif ou très riche en glucides → la glycémie reste élevée au matin.
• Sommeil court ou de mauvaise qualité → augmente la production hépatique de sucre.
• Stress aigu, infection, douleur → effet hyperglycémiant transitoire.
• Médicaments comme les corticoïdes, certains diurétiques ou antipsychotiques.
• Phénomène de l’aube (hormones de réveil qui poussent la glycémie au matin) — fréquent.
• Évolution de la maladie : si la valeur dépasse régulièrement 1,30-1,40 g/L au matin, ton traitement de fond peut nécessiter un ajustement.`,
      },
      {
        question: 'Quand s’inquiéter et quand ne pas s’inquiéter',
        body: `Une matinée isolée légèrement au-dessus de la cible n’est pas alarmante. Si la tendance s’installe sur plusieurs jours (3-4 valeurs > 1,40 g/L à jeun sur une semaine), parles-en à ton médecin lors du prochain rendez-vous.

Au-dessus de 2,5 g/L à jeun ou avec des symptômes (nausées, soif intense, somnolence), il faut contacter ton médecin aujourd’hui ou appliquer ton plan d’urgence.`,
      },
    ],
    sources: SOURCES_HAS_SFD,
  },

  'glycemia-severe-hyper': {
    id: 'glycemia-severe-hyper',
    title: 'Comprendre une hyperglycémie sévère et l’acidocétose',
    tagline:
      'Au-dessus de 3 g/L avec symptômes, c’est une urgence — voici les signes à reconnaître.',
    sections: [
      {
        question: 'Qu’est-ce qu’une hyperglycémie sévère ?',
        body: `Une glycémie au-dessus de 3 g/L (3,5 dans le diabète de type 2 stable) qui ne redescend pas, surtout si elle s’accompagne de signes inhabituels, peut évoquer une décompensation : ton organisme manque tellement d’insuline qu’il puise dans les graisses pour produire de l’énergie. Cela génère des corps cétoniques (acétone) — c’est l’acidocétose.

Elle est plus fréquente chez les patients sous insuline qui ont oublié une dose, lors d’une infection sévère, d’une chirurgie ou d’un stress aigu.`,
      },
      {
        question: 'Les signes à reconnaître',
        body: `• Soif intense et envies fréquentes d’uriner.
• Nausées, vomissements, douleurs au ventre.
• Haleine fruitée (« pomme reinette ») — typique de l’acétone.
• Respiration rapide et profonde (dyspnée de Kussmaul).
• Somnolence anormale, confusion.
• Déshydratation marquée.`,
      },
      {
        question: 'Que faire maintenant ?',
        body: `1) Recontrôle ta glycémie pour confirmer. Mesure aussi tes cétones si tu as des bandelettes urinaires ou un capteur.
2) Bois de l’eau pour compenser la déshydratation.
3) Si tu présentes au moins un des signes ci-dessus en plus de la glycémie élevée, appelle le 15 immédiatement.
4) Sinon, contacte ton médecin aujourd’hui et applique ton plan d’urgence.
5) N’attends pas plus de quelques heures sans avis médical.`,
      },
      {
        question: 'Pourquoi c’est sérieux',
        body: `L’acidocétose non traitée peut évoluer rapidement vers un coma. Elle se traite très bien à l’hôpital quand elle est prise tôt — l’enjeu est de ne pas la laisser s’installer. C’est pour ça que le 15 ne doit pas être hésité dès que les signes sont présents.`,
      },
    ],
    sources: SOURCES_HAS_FFD,
  },
};

/**
 * Map alert reason codes (produced by `computeGlycemiaAlert`) to the fiche
 * the user can open for context. Reason codes that don't have a fiche (e.g.
 * "in-target") return null.
 */
export function getFicheForReason(reasonCode: string): Fiche | null {
  switch (reasonCode) {
    case 'postmeal-very-high':
    case 'postmeal-high':
    case 'postmeal-above-target':
      return FICHES['glycemia-postmeal-high'] ?? null;
    case 'fasting-very-high':
    case 'fasting-high':
    case 'fasting-above-target':
      return FICHES['glycemia-fasting-high'] ?? null;
    case 'severe-hypo':
    case 'hypo-resucrage':
      return FICHES['glycemia-hypoglycemia'] ?? null;
    case 'severe-hyper':
      return FICHES['glycemia-severe-hyper'] ?? null;
    default:
      return null;
  }
}
