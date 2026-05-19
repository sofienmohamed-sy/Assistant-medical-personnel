# Assistant médical personnel

PWA d'accompagnement santé au quotidien pour patients atteints de pathologies chroniques (diabète T2, hypertension, asthme en v1).

> **État actuel : squelette technique uniquement.** Le produit lui-même (authentification, profils patients, suivi des pathologies, patterns CECD / CTL / VPE / MSR, mode médecin associé, base de connaissances) sera ajouté progressivement dans des PRs ultérieures. Le document de conception complet est dans [`docs/conception_assistant_medical_FINAL.md`](./docs/conception_assistant_medical_FINAL.md).

> **Note de conformité.** La section 5 du document de conception exige un hébergement HDS (Hébergement de Données de Santé) en UE. **Firebase n'est pas certifié HDS.** Cette stack est adaptée au prototypage et à la pré-production ; avant de stocker des données patient réelles en production, la couche données devra migrer vers un hébergeur certifié HDS (Scaleway HDS, OVH HDS, etc.).

---

## Stack

| Couche             | Choix                                                     |
| ------------------ | --------------------------------------------------------- |
| Frontend           | React 19 + Vite 7 + TypeScript strict                     |
| UI                 | Tailwind CSS v4 + shadcn/ui (style `new-york`)            |
| PWA                | `vite-plugin-pwa` (service worker, manifest, installable) |
| Routing            | React Router v7                                           |
| Auth               | Firebase Auth (SDK initialisé, UI à venir)                |
| Database           | Firebase Firestore                                        |
| Storage            | Firebase Storage                                          |
| Backend            | Firebase Functions v2 (Node 20, TypeScript)               |
| Hosting            | Firebase Hosting                                          |
| Tests unitaires    | Vitest + Testing Library                                  |
| E2E                | Playwright                                                |
| Linter / Formateur | ESLint flat config + Prettier                             |
| Monorepo           | pnpm workspaces                                           |

## Layout

```
.
├── apps/
│   └── web/                # Frontend Vite + React + PWA
├── packages/
│   ├── functions/          # Firebase Functions v2
│   └── shared/             # Types et schémas partagés
├── docs/                   # Document de conception
├── .github/workflows/      # CI/CD (4 workflows)
├── firebase.json           # Hosting + Functions + Firestore + Storage
├── firestore.rules         # Règles Firestore (owner-only par défaut)
├── firestore.indexes.json  # Index Firestore (vide initialement)
├── storage.rules           # Règles Storage (owner-only par défaut)
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 20 (`nvm use` reads `.nvmrc`)
- pnpm 9 (via `corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- Java 17 (uniquement si tu veux lancer les émulateurs Firebase localement)

## Commandes locales

```bash
pnpm install                    # Installer toutes les dépendances
pnpm dev                        # Lancer le frontend en dev (http://localhost:5173)
pnpm build                      # Builder le frontend et les functions
pnpm test                       # Tests unitaires Vitest (tous les packages)
pnpm typecheck                  # Vérifier les types TypeScript
pnpm lint                       # ESLint
pnpm format                     # Prettier (écriture)
pnpm format:check               # Prettier (vérification)
pnpm e2e:install                # Installer les navigateurs Playwright
pnpm e2e                        # Lancer les tests E2E Playwright
```

Pour configurer Firebase localement, copie `apps/web/.env.example` vers `apps/web/.env.local` et remplis les valeurs depuis ton projet Firebase.

## GitHub Actions

Trois workflows :

| Workflow         | Déclencheur       | But                                                                                                                |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pr-check.yml`   | `pull_request`    | Lint, format, typecheck, tests unitaires, build, validation des règles Firestore/Storage                           |
| `pr-preview.yml` | `pull_request`    | Build + déploiement sur un canal de prévisualisation Firebase Hosting, puis exécution des tests Playwright E2E     |
| `deploy.yml`     | `push` sur `main` | Sync des secrets GitHub → Firebase, puis déploiement des Functions, Firestore (règles + indexes), Storage, Hosting |

### Secrets et variables GitHub à configurer

Ouvre **Settings → Secrets and variables → Actions** dans GitHub puis ajoute :

| Nom                                 | Type     | Rôle                                                                                                                                                                        |
| ----------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT`          | Secret   | JSON du compte de service Google Cloud (rôles Firebase Admin + Cloud Functions Developer + Cloud Storage Admin + Secret Manager Admin). Utilisé pour tous les déploiements. |
| `FIREBASE_PROJECT_ID`               | Secret   | ID du projet Firebase.                                                                                                                                                      |
| `VITE_FIREBASE_API_KEY`             | Secret   | Config web Firebase, injectée au build du frontend.                                                                                                                         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Secret   | idem                                                                                                                                                                        |
| `VITE_FIREBASE_PROJECT_ID`          | Secret   | idem (peut être identique à `FIREBASE_PROJECT_ID`)                                                                                                                          |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Secret   | idem                                                                                                                                                                        |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Secret   | idem                                                                                                                                                                        |
| `VITE_FIREBASE_APP_ID`              | Secret   | idem                                                                                                                                                                        |
| `FUNCTIONS_SECRETS`                 | Variable | Liste, séparée par des virgules, des secrets à propager dans Firebase Functions Secret Manager (ex : `STRIPE_API_KEY,SENDGRID_API_KEY`). Laisser vide si aucun.             |
| `STRIPE_API_KEY` (exemple)          | Secret   | Si listé dans `FUNCTIONS_SECRETS`, sa valeur est propagée à Firebase au déploiement.                                                                                        |

> Tant que `FIREBASE_SERVICE_ACCOUNT` et `FIREBASE_PROJECT_ID` ne sont pas définis, le workflow `pr-preview.yml` saute proprement le déploiement de prévisualisation et les tests E2E s'exécutent contre un build local (`vite preview`). Le PR reste donc verte sur un repo qui vient d'être créé.

### Ajouter un nouveau secret de fonction

1. Ajoute la valeur dans GitHub : **Settings → Secrets and variables → Actions → New repository secret** (ex : `SENDGRID_API_KEY`).
2. Ajoute le nom à la variable `FUNCTIONS_SECRETS` (ex : `STRIPE_API_KEY,SENDGRID_API_KEY`).
3. Dans `.github/workflows/deploy.yml`, ajoute la ligne `SECRET_SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}` dans le bloc `env` de l'étape « Sync Firebase Functions secrets ».
4. Dans `packages/functions/src/secrets.ts`, ajoute `export const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');` puis référence-le dans les options du callable (`{ secrets: [SENDGRID_API_KEY] }`).
5. Mergeable : au prochain push sur `main`, la valeur sera poussée vers Firebase Secret Manager avant le déploiement des Functions.

## Compte de service Firebase

Pour générer le JSON du compte de service :

1. Va sur la console Google Cloud du projet → **IAM → Service accounts**.
2. Crée un compte de service avec les rôles : _Firebase Admin_, _Cloud Functions Developer_, _Cloud Storage Admin_, _Secret Manager Admin_, _Cloud Build Editor_.
3. **Keys → Add key → JSON**, télécharge le fichier.
4. Colle son contenu intégral dans le secret GitHub `FIREBASE_SERVICE_ACCOUNT`.

## Roadmap

Les fonctionnalités produit suivront, dans cet ordre indicatif :

1. Authentification (signup / signin / mot de passe oublié) Firebase Auth + UI shadcn/ui.
2. Onboarding patient : profil minimal, profils de traitement, mode famille.
3. Pattern CECD (Capture-Extract-Confirm-Discard) pour OCR ordonnances + écrans d'appareils.
4. Pattern CTL (Contextual Tap-List) pour la saisie rapide.
5. Pattern VPE (Visual Plate Estimation).
6. Pattern MSR (Multi-Source Response) — symptômes croisés avec pathologies actives.
7. Base de connaissances diabète T2 (validée médicalement, cf. annexe A).
8. Surveillance dynamique (états d'équilibre).
9. Mode médecin associé.
10. Pathologies hypertension + asthme.

Voir le document de conception pour le détail.
