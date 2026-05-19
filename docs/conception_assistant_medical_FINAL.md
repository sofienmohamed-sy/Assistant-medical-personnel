# Document de conception — Assistant médical personnel

**Version :** v0.7 — Version finale
**Date :** Mai 2026
**Statut :** Spécification produit complète + bases de connaissances + guide d'entretien + principe de transparence pédagogique

**Contenu :**
- Sections 1-16 : spécification produit complète
- Section 2.7 : principe de transparence pédagogique (NOUVEAU)
- Annexe A : base de connaissances Diabète type 2 + exemples de fiches pédagogiques
- Annexe B : base de connaissances Hypertension artérielle + exemples de fiches pédagogiques
- Annexe C : base de connaissances Asthme de l'adulte + exemples de fiches pédagogiques
- Annexe D : guide d'entretien pour validation médicale

---

## Table des matières

1. Vision et positionnement
2. Principes déontologiques fondamentaux
3. Architecture du profil utilisateur
4. Le pilier : base de connaissances médicales
5. Sécurité juridique et conformité RGPD
6. Les quatre patterns d'interaction signature
7. **Surveillance dynamique : états d'équilibre du patient (NOUVEAU)**
8. Travail en arrière-plan et notifications
9. Mode médecin associé
10. Scénarios types complets
11. Fonctionnalités v1 (MVP)
12. Stack technique
13. Modèle économique
14. **Validation médicale du contenu (NOUVEAU)**
15. Sujets à creuser
16. Récapitulatif — Ce qui rend cette app unique

---

## 1. Vision et positionnement

### 1.1 Pitch en une phrase

> *Une application mobile d'accompagnement de santé personnel qui veille au quotidien sur l'utilisateur et sa famille, en s'adaptant à son équilibre médical réel — sans jamais se substituer au médecin, mais en pouvant l'intégrer dans le suivi.*

### 1.2 Métaphore de référence

- **Un journal vivant de santé**
- **Un infirmier de coordination** (observe, rapporte, alerte sans prescrire)
- **Un compagnon qui apprend** (silencieusement)
- **Un canal de communication entre patient et médecin entre les consultations**

### 1.3 Public cible

Tous les profils — malades chroniques, parents, personnes âgées, jeunes en bonne santé. Point d'entrée prioritaire : le parent.

### 1.4 Différenciation principale

1. **Quatre patterns d'interaction médicale signature** (CECD, CTL, VPE, MSR)
2. **Adaptation silencieuse au mode de vie et à l'équilibre médical réel**
3. **Surveillance dynamique** ajustée à l'état d'équilibre du patient
4. **Ligne déontologique stricte**
5. **Principe de séparation des couches** (le médecin n'affecte jamais le protocole)
6. **Transparence pédagogique** (chaque message a une fiche "En savoir plus")
7. **Suivi familial multi-générations**
8. **Engagement zéro données commerciales**

---

## 2. Principes déontologiques fondamentaux

### 2.1 Ligne rouge thérapeutique

L'app **suggère**. L'app **ne touche jamais à la thérapeutique**.

### 2.2 Modèle de message intelligent factuel

```
1. CONSTAT FACTUEL
2. COMPARAISON À LA NORME (avec source)
3. EXPLICATION SOURCÉE
4. RECOMMANDATION NEUTRE
5. ESCALADE SI CRITIQUE
6. DISCLAIMER STANDARD
```

### 2.3 Principe de non-minimisation des signaux

> *L'app capture et présente fidèlement les données dans leur contexte. Elle n'interprète jamais une donnée anormale comme normale, peu importe l'explication fournie.*

### 2.4 Principe de focus exclusif sur les pathologies actives

L'app ne joue pas le rôle de généraliste virtuel.

### 2.5 Principe de séparation des couches

> *Les recommandations du médecin associé sont une couche complémentaire qui s'ajoute au protocole de l'app sans jamais le modifier.*

### 2.6 Principe de validation médicale du contenu

> *Aucune donnée médicale produite par l'app (seuils, symptômes, conseils, hiérarchie d'alertes) ne sort en production sans avoir été relue et validée par un professionnel de santé qualifié dans la pathologie concernée.*

Détaillé en section 14.

### 2.7 Principe de transparence pédagogique

> *Chaque message contenant une information médicale est doublé d'un niveau "En savoir plus" optionnel, qui ouvre une fiche pédagogique structurée expliquant les différents cas possibles, le contexte scientifique, et les sources. L'app ne se contente pas d'informer : elle fait évoluer la connaissance du patient sur sa propre maladie.*

**Deux niveaux d'information pour chaque message :**

| Niveau | Contenu | Présentation |
|---|---|---|
| Niveau standard | Le message-type (constat, comparaison à la norme, recommandation neutre) | 3-6 lignes, toujours affiché |
| Niveau "En savoir plus" | Fiche pédagogique structurée multi-cas | Dépliable, optionnel |

**Structure type d'une fiche pédagogique :**

```
▼ Que signifie cette valeur / ce symptôme ?
▼ Pourquoi cette cible / ce seuil ?
▼ Les différents cas possibles (hiérarchie de probabilité)
▼ Quand s'inquiéter / quand ne pas s'inquiéter ?
▼ Sources publiques citées
```

**Principes éditoriaux des fiches :**
- **Factuel** (pas de drame inutile)
- **Vulgarisé** (accessible à un non-médecin)
- **Multi-causal** (toujours plusieurs hypothèses présentées, pas une seule)
- **Équilibré** (rassurant quand c'est rassurant, ferme quand c'est sérieux)
- **Sourcé** (chaque affirmation citable)

**Bénéfices :**
1. **Transparence** : le patient peut vérifier ce que l'app affirme
2. **Confiance** : pouvoir vérifier renforce l'adhésion aux alertes
3. **Éducation thérapeutique** : à force de "Afficher plus", le patient devient acteur de sa maladie
4. **Désamorçage de l'anxiété** : les alertes rouges sont moins traumatisantes quand on peut lire les hypothèses bénignes parmi les graves
5. **Préparation des consultations** : un patient qui a lu sur ses valeurs sait quoi demander à son médecin
6. **Positionnement marketing différenciant** : rare dans le marché des apps santé

**Implications produit :**
- Chaque entrée de la base de connaissances doit avoir une fiche pédagogique associée
- Le contenu pédagogique est validé médicalement au même titre que les seuils
- Présentation : dépliable, jamais surchargée, jamais imposée

### 2.7 Conséquence juridique

Statut **app de bien-être / observance**. Pas de marquage CE médical en v1.

---

## 3. Architecture du profil utilisateur

### 3.1 Les trois couches du profil

```
COUCHE 1 — Profil initial déductif (pays + origine + profession)
COUCHE 2 — Apprentissage silencieux (en continu)
COUCHE 3 — Saisie manuelle facultative
```

**Priorité d'utilisation** : Couche 3 > Couche 2 > Couche 1
**Règle fondamentale** : la Couche 2 ne s'arrête JAMAIS.

### 3.2 Apprentissage silencieux continu

- Seuil de confiance : 3 observations cohérentes = hypothèse, 5-7 = vérité
- Silence total : l'app n'affiche jamais "voici ce que j'ai appris"
- Transparence à la demande dans les paramètres
- Journalisation dans l'archive de preuve

### 3.3 Apprentissage par opportunité médicale

**Règle d'or :**
> *L'app ne pose jamais une question dont la réponse ne sert pas à mieux l'aider dans les minutes ou heures qui suivent.*

### 3.4 Modes événements de vie

Calques temporaires : Ramadan, Voyage, Vacances, Grossesse, Hospitalisation, Examens, Aidant, Deuil.

---

## 4. Le pilier : base de connaissances médicales

### 4.1 Structure double-indexée

**Par pathologie** : profils de traitement, paramètres, symptômes, examens, plan d'urgence.
**Par symptôme** : pathologies pertinentes, tests discriminants, niveaux d'alerte, signaux d'urgence transverses.

### 4.2 Sources publiques

HAS, sociétés savantes, INSERM, OMS, Ameli, Vidal grand public, base CIS publique.

**Chaque message de l'app cite ses sources.**

### 4.3 Gestion des comorbidités

Modules indépendants + garde-fou (renvoi au médecin pour interactions).
Pour les symptômes croisés : pattern MSR qui traverse les modules de pathologies actives.

### 4.4 Pathologies prioritaires v1

1. Diabète type 2
2. Hypertension artérielle
3. Asthme

### 4.5 Indicateurs synthétiques d'équilibre par pathologie

Pour chaque pathologie, identifier **un indicateur synthétique** calculable à partir des mesures du patient, utilisé **uniquement en interne** pour piloter la surveillance (voir section 7) :

| Pathologie | Indicateur synthétique interne | Usage |
|---|---|---|
| Diabète type 2 | HbA1c estimée (formule eAG / ADA) | Pilotage surveillance, jamais affiché |
| Hypertension | Moyenne mensuelle pondérée de tension | Pilotage surveillance, jamais affiché |
| Asthme | Fréquence d'utilisation de bronchodilatateur de secours | Pilotage surveillance, peut être affiché si pertinent |

**Règle critique :** ces indicateurs estimés ne sont **jamais affichés** au patient comme valeurs précises. Ils servent uniquement à l'app pour décider du niveau de surveillance. La fiabilité d'une estimation interne suffit pour ajuster la vigilance, pas pour informer le patient d'une valeur potentiellement inexacte.

### 4.6 Base de catégories alimentaires standardisées (pour VPE)

Féculents, Viandes/Poissons/Œufs, Légumes, Produits laitiers, Fruits, Sucré.

---

## 5. Sécurité juridique et conformité RGPD

### 5.1 Logique de preuve (boîte noire d'avion)

Les données servent de preuve d'audit, pas au produit.

### 5.2 Architecture à deux bases

- **Active** : modifiable, supprimable
- **Archive scellée** : immuable, accès DPO sur demande légale

### 5.3 Conformité RGPD

- Hébergement HDS en UE (Scaleway HDS recommandé)
- Archive scellée 10 ans
- Aucune donnée n'entraîne d'IA
- Aucun usage commercial secondaire

### 5.4 Données du médecin associé

Toutes les actions du médecin sont tracées dans l'archive scellée. Le patient peut révoquer à tout moment.

---

## 6. Les quatre patterns d'interaction signature

### 6.1 CECD — Capture-Extract-Confirm-Discard

Photos d'écrans d'appareils, ordonnances, médicaments. OCR + confirmation utilisateur + destruction photo.

### 6.2 CTL — Contextual Tap-List

Saisie par sélection dans des listes apprenantes. Liste personnelle en tête, liste contextuelle, champ libre.

### 6.3 VPE — Visual Plate Estimation

Estimation de composition de repas par sélection d'une assiette-type illustrée (8 assiettes + modificateurs). 3 niveaux de granularité.

### 6.4 MSR — Multi-Source Response

Réponse à un symptôme rapporté en croisant avec les pathologies actives du patient. Format structuré avec tests discriminants et conditions d'urgence.

---

## 7. Surveillance dynamique : états d'équilibre du patient

### 7.1 Principe fondamental

La surveillance ne se règle **pas** sur le profil de traitement (Metformine, insuline, etc.) seul. Elle se règle sur **l'équilibre médical réel** du patient à l'instant présent.

Un patient sous insuline parfaitement équilibré n'a pas besoin d'une surveillance maximale. Un patient sous Metformine en pleine décompensation, si.

### 7.2 Les états dynamiques

L'app classe en permanence le patient dans l'un de ces états (en interne, sans le lui afficher) :

| État | Surveillance | Logique |
|---|---|---|
| **Équilibré** | Normale | Mesures dans les objectifs, indicateur synthétique stable |
| **Non équilibré** | Modérée | Dérives ponctuelles, indicateur en glissement |
| **Déséquilibre sévère** | Intense | Multiples valeurs hors-cible, indicateur clairement dégradé |
| **Déséquilibre sévère - phase consultation** | Intense maintenue | En attente ou suite à consultation médicale |
| **Retour à l'équilibre** | Décroissante | Valeurs reviennent dans les objectifs, surveillance se relâche progressivement |

### 7.3 Critères de transition entre états

Pour chaque pathologie, des critères **sourcés** dans les recommandations officielles définissent les seuils de bascule. Ces critères doivent être **validés médicalement** (voir section 14).

**Exemple pour le diabète type 2** (à valider) :
- Équilibré → Non équilibré : HbA1c estimée >7% ou plusieurs valeurs glycémiques hors-cible sur 2 semaines
- Non équilibré → Déséquilibre sévère : HbA1c estimée >8,5% ou présence répétée de glycémies critiques
- Déséquilibre sévère → Retour à l'équilibre : tendance favorable confirmée sur plusieurs semaines

### 7.4 Effet concret sur les notifications et la surveillance

| État | Notifications/jour | Mesures demandées | Questions de suivi |
|---|---|---|---|
| Équilibré | 1-2 | Espacées | Rares |
| Non équilibré | 2-4 | Renforcées | Modérées |
| Déséquilibre sévère | 4-7 | Pluri-quotidiennes | Fréquentes |
| Phase consultation | 4-7 maintenu | Identique | Identique |
| Retour à l'équilibre | Diminution progressive | Diminution progressive | Diminution |

### 7.5 Pourquoi ce modèle résout le fil abus/négligence

Le fil entre **abus** (trop de notifications) et **négligence** (pas assez de surveillance) ne se tient pas par des règles fixes liées au traitement. Il se tient en **suivant l'état réel du patient à l'instant T**.

Quand tout va bien, l'app se fait discrète. Quand ça dérape, l'app intensifie. Quand ça se stabilise, elle se relâche.

**Le seul vrai rempart contre la négligence reste la qualité et l'exhaustivité de la base de connaissances** (section 14). Aucun mécanisme adaptatif ne compense une base incomplète : on ne peut pas alerter sur ce qu'on ne connaît pas.

### 7.6 Visibilité côté patient

Le patient **ne voit pas** l'étiquette d'état que l'app lui attribue. Il constate simplement que l'app est plus présente ou plus discrète selon les périodes.

À la demande, dans les paramètres, il peut consulter une rubrique *"Pourquoi tu m'écris plus souvent en ce moment ?"* qui explique factuellement (valeurs récentes hors-cible, signes à surveiller) sans afficher une étiquette anxiogène.

### 7.7 Visibilité côté médecin associé

Le médecin associé voit l'état dans son tableau de bord (🟢 / 🟡 / 🔴) — c'est utile pour lui pour prioriser ses patients.

---

## 8. Travail en arrière-plan et notifications

### 8.1 Principe

L'utilisateur n'a pas besoin d'ouvrir l'app. Notifications planifiées + serveur qui détecte les patterns.

### 8.2 Architecture client/serveur

Téléphone = affichage et saisie. Serveur = analyse, détection, génération de rapports.

### 8.3 Notifications interactives

Réponse directe depuis la notification, sans ouvrir l'app.

### 8.4 Dosage des notifications

Le dosage suit l'**état d'équilibre dynamique** (section 7.4), pas un nombre fixe par profil de traitement.

### 8.5 Respect du contexte

Sauf urgence vitale : heures de sommeil, calendrier, mode silencieux, modes événements de vie.

---

## 9. Mode médecin associé

### 9.1 Principes fondamentaux

- **Association unidirectionnelle** : seul le patient peut associer son médecin
- **Séparation des couches** : les actions du médecin n'affectent jamais le protocole
- **Pas de prescription dans l'app** : seulement des précautions temporaires

### 9.2 Architecture en couches

```
COUCHE A — Protocole de l'app (immuable, sourcé)
COUCHE B — Recommandations du médecin associé (additives, temporaires)
```

### 9.3 Modes d'association

- **Mode A** : médecin externe par email (rapport envoyé par le patient)
- **Mode B** : médecin invité dans l'app (compte minimal, vue sur ce patient seulement)

### 9.4 Ce que le médecin peut faire (précautions temporaires)

Suivi de mesure, vigilance symptôme, conseil hygiène, alerte personnalisée, note libre, recommandation consultation, confirmation/rassurance — toutes avec **date d'expiration obligatoire**.

### 9.5 Ce que le médecin ne peut pas faire

Prescrire, modifier un dosage de traitement de fond dans l'app, désactiver une alerte, modifier les seuils du protocole.

### 9.6 Confirmation patient obligatoire

Pour chaque nouvelle précaution, le patient confirme "J'ai lu et compris" → tracé dans l'archive.

### 9.7 Distinction visuelle stricte

🩺 De l'app vs 👨‍⚕️ De ton médecin.

### 9.8 Architecture de données

Deux registres distincts dans le journal patient :
- Prescriptions officielles (ordonnances scannées ou saisies après consultation réelle)
- Précautions temporaires (issues du médecin associé, avec date d'expiration)

### 9.9 Notifications croisées en cas d'alerte critique

Patient et médecin notifiés. Le médecin peut répondre en un clic. Le patient voit la réponse.

---

## 10. Scénarios types complets

Voir scénarios A, B et C dans le document v0.4 (mesure post-repas anormale, symptôme rapporté MSR, précaution temporaire médecin).

---

## 11. Fonctionnalités v1 (MVP)

### 11.1 Patient
- Inscription, profil minimal, profil médical avec profils de traitement
- Saisie médicale (CECD pour photos, manuelle, plan d'urgence)
- Suivi quotidien adapté à l'état d'équilibre dynamique
- Réponse aux symptômes (MSR)
- Alertes graduées (niveau 1 / 2 / 3)
- Rapport médecin
- Gestion familiale
- Modes événements de vie
- Transparence à la demande

### 11.2 Médecin associé
- Association à l'invitation du patient
- Tableau de bord patients (statut 🟢 / 🟡 / 🔴)
- Lecture du journal patient
- Saisie de précautions temporaires structurées
- Réception d'alertes critiques + réponse en un clic

---

## 12. Stack technique

| Couche | Choix | Coût |
|---|---|---|
| Mobile patient | React Native ou PWA | gratuit |
| Web médecin | Next.js responsive | gratuit |
| Backend | Node.js / Python | gratuit |
| Base de données | PostgreSQL sur serveur HDS | 0-30 €/mois |
| Hébergement | Scaleway HDS | 20-50 €/mois |
| OCR écrans 7-segments | Modèle open source | gratuit |
| OCR ordonnances | Google ML Kit / Apple Vision | gratuit |
| Base médicaments | CIS publique | gratuit |
| Notifications | Push natif | gratuit |
| Emails transactionnels | Brevo, Resend | 0-20 €/mois |
| Paiement | Stripe | commission |
| Illustrations VPE | Figma+IA ou freelance | 0-150 € |

---

## 13. Modèle économique

### 13.1 Patient
- Freemium : 1 pathologie + base — gratuit
- Premium individuel : 9,90 €/mois
- Premium famille : 14,90 €/mois (jusqu'à 6 comptes)

### 13.2 Médecin
- v1 : gratuit pour le médecin
- v2+ : abonnement médecin ou intégration télésurveillance Sécurité sociale

---

## 14. Validation médicale du contenu

### 14.1 Principe et nécessité

Tout le système (architecture, patterns, principes, RGPD, mode médecin associé) peut être conçu par un fondateur seul. Le **contenu médical** ne peut pas l'être.

Aucun seuil, aucune liste de symptômes, aucune hiérarchie d'alerte, aucun conseil ne doit sortir en production sans avoir été relu et validé par un professionnel de santé qualifié dans la pathologie concernée.

Cette validation n'est pas une formalité. Elle est le **seul vrai rempart contre la négligence**. Aucun mécanisme adaptatif ne peut compenser une base de connaissances incomplète ou incorrecte : l'app ne peut pas alerter sur ce qu'elle ne connaît pas, et risque de mal alerter sur ce qu'elle connaît mal.

### 14.2 Périmètre minimal de validation par pathologie

Pour chaque pathologie ajoutée à l'app, un professionnel valide :

| Élément | Description |
|---|---|
| Liste des paramètres mesurables | Glycémie, tension, etc. |
| Normes et seuils par paramètre | Valeurs cibles, seuils d'alerte |
| Liste exhaustive des symptômes | Normaux, alerte rouge, complications |
| Hiérarchie d'escalade par symptôme | Niveau 1 / 2 / 3 |
| Examens de suivi | Calendrier, fréquence |
| Vigilances et interactions | Médicaments, modes de vie |
| Plan d'urgence type | Conduite à tenir standard |
| Critères des états d'équilibre | Transitions équilibré / non équilibré / sévère |
| Indicateur synthétique interne | Formule de calcul, marges d'erreur |
| Messages-types par seuil et par symptôme | Formulation exacte |

### 14.3 Profil du professionnel adapté

| Pathologie | Profil idéal |
|---|---|
| Diabète type 2 | Endocrinologue, diabétologue, ou médecin généraliste avec DU diabétologie |
| Hypertension | Cardiologue, médecin généraliste avec DU HTA, ou néphrologue |
| Asthme | Pneumologue ou médecin généraliste avec DU pneumologie |

Pour la v1, un **médecin généraliste motivé** peut valider toutes les pathologies de base, à condition qu'il prenne le temps de relire scrupuleusement. Plus tard, des spécialistes par pathologie.

### 14.4 Format de la prestation

**Option A — Prestation ponctuelle**
Le médecin est payé à l'heure ou au forfait (500-1500 € par pathologie selon la profondeur de relecture). Pas de lien long terme.

**Option B — Comité scientifique léger**
2-3 médecins associés au projet, payés à la prestation pour chaque mise à jour. Bandeau "validé par notre comité médical" sur l'app.

**Option C — Médecin cofondateur**
Un médecin entre au capital en échange de parts, valide tout, devient référent médical. Plus engageant, plus crédible, plus long à mettre en place.

→ **Recommandation v1** : option A pour démarrer, évolution vers B quand l'app croît.

### 14.5 Calendrier proposé

| Moment | Action |
|---|---|
| Avant développement de la pathologie | Validation initiale du périmètre, de l'arbre symptômes/seuils |
| Avant lancement public | Validation finale des messages, scénarios, alertes |
| Tous les 6 mois | Revue de mise à jour (nouvelles recommandations HAS, retours utilisateurs) |
| En cas d'incident significatif | Revue immédiate de la zone concernée |

### 14.6 Coût total estimé

| Phase | Pathologies validées | Coût estimé |
|---|---|---|
| MVP minimum | 1 pathologie (diabète T2) | 500-1500 € |
| v1 complète | 3 pathologies | 1500-4500 € |
| v2 | 5-6 pathologies | 2500-7500 € |
| Maintenance annuelle | Toutes pathologies actives | 1000-3000 €/an |

Faisable progressivement avec les premiers revenus.

### 14.7 Conséquence sur la roadmap

Le projet ne peut pas lancer une pathologie tant qu'elle n'a pas été validée médicalement. Cela impose un **séquencement** : pas tout en même temps, mais une pathologie après l'autre, chacune solidement validée.

Mieux vaut **une pathologie bien faite** que cinq pathologies approximatives.

---

## 15. Sujets à creuser

### 15.1 Conception produit
- [ ] Construction concrète de la base de connaissances diabète T2 (avec validation médicale)
- [ ] Critères précis des états d'équilibre par pathologie (avec validation)
- [ ] Illustrations VPE
- [ ] Onboarding patient et médecin
- [ ] Ton et personnalité de l'app
- [ ] Nom et identité visuelle

### 15.2 Architecture technique
- [ ] Architecture client/serveur détaillée
- [ ] Système des états d'équilibre (transitions, calcul des indicateurs synthétiques)
- [ ] Système d'apprentissage continu
- [ ] Système d'archivage scellé immuable

### 15.3 Lancement
- [ ] Identification d'un premier médecin valideur (généraliste motivé ou spécialiste)
- [ ] Stratégie d'acquisition patients
- [ ] CGU, politique de confidentialité, mentions RGPD
- [ ] Roadmap extension géographique

### 15.4 Évolutions
- [ ] v1.5 — validation médicale des couples de pathologies fréquents
- [ ] v2 — authentification RPPS médecins
- [ ] v2 — extension à plus de pathologies
- [ ] v3 — étude de faisabilité dispositif médical pour profils à risque

---

## 16. Récapitulatif — Ce qui rend cette app unique

1. Quatre patterns d'interaction médicale (CECD + CTL + VPE + MSR)
2. Architecture en 3 couches du profil
3. Apprentissage silencieux et permanent
4. Ligne déontologique stricte
5. Principe de non-minimisation des signaux
6. Focus exclusif sur les pathologies actives
7. **Surveillance dynamique par états d'équilibre**
8. **Indicateurs synthétiques internes par pathologie (jamais affichés)**
9. Profils de traitement différenciés au sein de chaque pathologie
10. Messages factuels intelligents sourcés
11. **Transparence pédagogique avec fiches "En savoir plus"**
12. Architecture RGPD à deux bases
13. Conception sans IA invasive
14. Adaptation culturelle silencieuse
15. Travail en arrière-plan
16. Dosage des notifications selon l'état d'équilibre, pas selon le traitement
17. Suivi familial multi-générations
18. Engagement zéro données commerciales
19. Mode médecin associé avec séparation des couches
20. Précautions temporaires distinctes des prescriptions officielles
21. Association unidirectionnelle initiée par le patient
22. **Validation médicale obligatoire du contenu avant production**

---

---

# ANNEXES

Les annexes qui suivent constituent les **livrables opérationnels** du projet à l'état v0.6 :

- **Annexe A — Base de connaissances : Diabète type 2**
- **Annexe B — Base de connaissances : Hypertension artérielle**
- **Annexe C — Base de connaissances : Asthme de l'adulte**
- **Annexe D — Guide d'entretien pour validation médicale**

Ces annexes sont **structurées selon la section 4 du document de conception**. Elles sont à **valider médicalement** avant mise en production, comme posé par le principe 2.6.

Pour le diabète type 2, le contenu reflète le travail collaboratif du porteur de projet (qui connaît la pathologie) complété par les sources publiques. Pour l'hypertension et l'asthme, le contenu est entièrement compilé depuis les sources publiques officielles.

---

# ANNEXE A — Base de connaissances : Diabète type 2

## A.1 Définition

Le diabète de type 2 est une maladie chronique caractérisée par une hyperglycémie persistante liée à une insulino-résistance et/ou une insuffisance de sécrétion d'insuline. Il représente plus de 90% des cas de diabète.

**En France :** environ 4 millions de personnes diabétiques (type 1 + type 2).

## A.2 Paramètres mesurables et normes

| Paramètre | Norme | Source |
|---|---|---|
| Glycémie à jeun | 0,70-1,10 g/L | HAS |
| Glycémie 2h post-prandiale | < 1,40 g/L | HAS |
| HbA1c (population non diabétique) | < 5,7% | HAS |
| HbA1c cible diabète T2 standard | < 7% | HAS 2024 |
| HbA1c cible diabète T2 récent, sans antécédents CV, espérance vie > 15 ans | ≤ 6,5% | HAS 2024 |
| HbA1c cible personne âgée fragile / antécédents CV | ≤ 8% | HAS 2024 |
| Glycémie cible à jeun grossesse | < 0,95 g/L | HAS 2024 |
| Glycémie cible post-prandiale grossesse | < 1,20 g/L | HAS 2024 |

**Note :** la cible HbA1c est **individualisée** selon le profil (âge, ancienneté, comorbidités, espérance de vie, risque hypoglycémique).

## A.3 Profils de traitement (déterminent le schéma de surveillance)

| Profil | Description | Risque hypoglycémie | Vigilance |
|---|---|---|---|
| A — Hygiéno-diététique seul | Diabète léger ou récent | Quasi nul | Faible |
| B — Antidiabétiques oraux sans risque hypoglycémique | Metformine, iSGLT2, GLP-1 | Très faible | Modérée |
| C — Antidiabétiques oraux avec risque hypoglycémique | Sulfamides (Diamicron, Amarel), glinides | Modéré | Élevée |
| D — Insuline basale (lente seule) | Souvent en complément des ADO | Réel | Élevée |
| E — Insuline basal-bolus | Insuline lente + rapide aux repas | Important | Maximale |

**Cas particuliers :**
- Pompe à insuline
- Capteur continu de glycémie (FreeStyle Libre, Dexcom)
- Diabète gestationnel
- Diabète corticoinduit

## A.4 Symptômes par catégorie

### Symptômes d'hyperglycémie chronique (à surveiller en routine)
- Soif inhabituelle (polydipsie)
- Mictions fréquentes (polyurie)
- Fatigue inhabituelle
- Vision floue
- Cicatrisation lente
- Infections urinaires ou cutanées récurrentes
- Perte de poids inexpliquée (parfois)

### Symptômes d'hypoglycémie (alerte rouge — chez patients sous insuline ou sulfamides)
- Sueurs froides, pâleur
- Tremblements
- Palpitations, tachycardie
- Faim soudaine intense
- Vertiges
- Confusion mentale, difficulté de concentration
- Irritabilité inhabituelle
- Vision trouble
- Sensation de malaise général
- Engourdissements péribuccaux

**Signes de gravité (hypoglycémie sévère) :**
- Troubles de la conscience
- Convulsions
- Perte de connaissance
- Coma hypoglycémique

### Symptômes d'hyperglycémie sévère / acidocétose (alerte rouge)
- Nausées et vomissements
- Douleurs abdominales
- Haleine fruitée (« pomme reinette ») — acétone
- Respiration rapide et profonde (dyspnée de Kussmaul)
- Somnolence anormale
- Déshydratation marquée
- Soif intense

### Symptômes de complications à long terme (signaler au médecin)

**Microangiopathiques :**
- Picotements, fourmillements, douleurs neuropathiques (mains, pieds)
- Diminution de sensibilité aux pieds
- Plaies qui ne cicatrisent pas
- Dégradation progressive de la vision (rétinopathie)
- Œdèmes (rétention hydrique, néphropathie)

**Macroangiopathiques :**
- Douleurs thoraciques à l'effort (coronaropathie)
- Claudication intermittente (artériopathie membres inférieurs)
- Troubles neurologiques transitoires (AIT, AVC)

## A.5 Hiérarchie d'alerte proposée

**Niveau 1 — Information neutre :**
- 1 glycémie isolée entre 1,40 et 2 g/L post-prandiale chez patient stable
- Action : observation, contexte (repas, activité), suivi de la tendance

**Niveau 2 — Consulter le médecin :**
- Plusieurs glycémies > 2 g/L sur la semaine
- HbA1c estimée (interne) dépassant la cible personnelle
- Symptômes chroniques d'hyperglycémie persistants
- Action : « Contacte ton médecin cette semaine »

**Niveau 3a — Urgence relative :**
- Glycémie > 2,5 g/L à jeun ou > 3 g/L post-prandiale, répétée
- Symptômes d'hypoglycémie (sueurs, tremblements, faim soudaine) : application du plan d'urgence hypoglycémie
- Action : application immédiate du plan d'urgence personnalisé

**Niveau 3b — Urgence vitale (15) :**
- Glycémie < 0,5 g/L
- Hypoglycémie avec troubles de la conscience
- Symptômes d'acidocétose (nausées, vomissements, haleine fruitée, dyspnée)
- Glycémie > 3 g/L avec symptômes d'acidocétose
- Action : « Applique ton plan d'urgence, et/ou appelle le 15 »

## A.6 Plan d'urgence type — Hypoglycémie (standard HAS)

**Si glycémie < 0,7 g/L OU symptômes évocateurs d'hypoglycémie :**

1. **Resucrage rapide** : 15 g de sucre rapide (3 morceaux de sucre, 1 verre de jus de fruit, 1 cuillère à soupe de miel ou de confiture)
2. **Repos** : s'asseoir, ne pas conduire, ne pas faire d'effort
3. **Recontrôle à 15 minutes**
4. **Si toujours < 0,7 g/L** : répéter le resucrage rapide
5. **Si toujours bas après 2 resucrages** : appel du 15 ou du médecin
6. **Si symptômes sévères (confusion, troubles de la conscience)** : 15 immédiatement
7. **Après normalisation** : prendre une collation à index glycémique bas pour stabiliser (pain + fromage par ex.)
8. **Noter l'épisode** dans le journal pour évoquer en consultation

## A.7 Examens de suivi à rappeler

| Examen | Fréquence |
|---|---|
| HbA1c | Tous les 3 mois |
| Bilan lipidique | Annuel |
| Bilan rénal (créatinine, DFG estimé, microalbuminurie) | Annuel |
| Examen ophtalmologique (fond d'œil) | Annuel |
| ECG de repos | Annuel |
| Examen des pieds (sensibilité, état cutané) | Annuel minimum |
| Examen bucco-dentaire | Annuel |
| Consultation diabétologue | 1-2 fois/an selon profil |
| Consultation cardiologue | Annuel si profil à risque |
| Vaccination grippe + COVID + pneumocoque | Selon recommandations |

## A.8 Vigilances et interactions

**Médicaments à signaler / surveiller :**
- Corticoïdes : peuvent élever significativement la glycémie
- Diurétiques thiazidiques : effet hyperglycémiant possible
- Bêta-bloquants non cardio-sélectifs : peuvent masquer les signes d'hypoglycémie
- Certains antipsychotiques (olanzapine, etc.)
- Médicaments contenant du sucre (sirops, certaines vitamines)

**Aliments et situations à risque :**
- Jeûne prolongé (chez patients sous insuline ou sulfamides)
- Alcool à jeun (risque d'hypoglycémie retardée)
- Activité physique intense non préparée (chez patients sous insuline)
- Infections (déstabilisent la glycémie)
- Stress aigu, chirurgie

**Modes de vie (recommandations HAS) :**
- Alimentation équilibrée, limitation des sucres rapides
- Activité physique régulière : 150 min/semaine d'activité modérée minimum
- Arrêt du tabac
- Limitation de l'alcool
- Maintien d'un poids stable (perte si surpoids)
- Sommeil suffisant

## A.9 États d'équilibre proposés (pour surveillance dynamique interne)

| État | Critères proposés |
|---|---|
| Équilibré | HbA1c estimée dans la cible. Glycémies majoritairement dans les objectifs. Pas d'hypoglycémie sévère. |
| Non équilibré | HbA1c estimée légèrement au-dessus. Glycémies fréquemment hors-cible. Quelques hypoglycémies mineures. |
| Déséquilibre sévère | HbA1c estimée > 8,5% ou glycémies répétées > 3 g/L OU hypoglycémies sévères répétées. |
| Phase consultation | Suit un déséquilibre, ajustement thérapeutique en cours. |
| Retour à l'équilibre | Tendance favorable confirmée sur 4-6 semaines. |

**Indicateur synthétique interne (jamais affiché) :** HbA1c estimée selon formule eAG validée par l'ADA, calculée sur les glycémies des 2-3 derniers mois si suffisamment réparties.

## A.10 Messages-types proposés

**Glycémie post-prandiale modérément élevée :**
> "Glycémie à 1,75 g/L 2h après ton repas. Au-dessus de la cible usuelle (<1,40 g/L 2h post-repas, source HAS). Cette valeur isolée peut s'expliquer par un repas plus riche que d'habitude. Continue ton suivi habituel. Si plusieurs valeurs élevées dans la semaine, parle-en à ton médecin."

**Glycémie élevée répétée :**
> "Cette semaine, plusieurs glycémies ont dépassé 2 g/L. Ce n'est pas alarmant en soi, mais c'est utile à signaler à ton médecin lors de votre prochain rendez-vous pour qu'il évalue ton traitement."

**Symptômes d'hypoglycémie :**
> "Les symptômes que tu décris (sueurs, tremblements, faim soudaine) peuvent évoquer une hypoglycémie. Selon ton plan d'urgence : prends 15 g de sucre rapide maintenant, reste assis, mesure ta glycémie si tu peux. Je te recontacte dans 15 minutes. Si tu te sens vraiment mal ou si tu as des troubles de la conscience, appelle le 15."

**Symptômes évocateurs d'acidocétose :**
> "Les symptômes que tu décris (nausées, haleine inhabituelle, respiration rapide) associés à une glycémie élevée peuvent évoquer une décompensation acidocétosique. C'est une urgence. Applique ton plan d'urgence et **appelle le 15 immédiatement**."

## A.11 Exemples de fiches pédagogiques ("En savoir plus")

### Fiche A.11.1 — Comprendre une glycémie post-prandiale élevée

```
▼ Que signifie 1,75 g/L 2h après un repas ?
   Après un repas, ta glycémie augmente naturellement.
   La cible recommandée 2h après un repas est < 1,40 g/L
   pour limiter les complications à long terme.
   Au-delà, on parle d'hyperglycémie post-prandiale.

▼ Pourquoi cette cible ?
   Une glycémie qui reste élevée régulièrement après les
   repas augmente l'HbA1c (ta moyenne sur 3 mois), qui
   est le marqueur principal des risques de complications
   (yeux, reins, nerfs, cœur).

▼ Les différents cas possibles
   • Repas plus riche en glucides qu'à l'habitude
     → Pic isolé, sans conséquence si rare
   • Aliments à index glycémique élevé (pain blanc, sucré)
     → Élévation rapide attendue
   • Stress ou maladie en cours
     → Le stress élève transitoirement la glycémie
   • Médicament pris en retard ou oublié
     → Vérifie ton observance
   • Activité physique réduite par rapport à d'habitude
     → Moins de glucose consommé par les muscles
   • Évolution de la maladie
     → Si récurrent, ton traitement peut nécessiter
       un ajustement (à voir avec ton médecin)

▼ Quand s'inquiéter ?
   Une valeur isolée n'est pas grave. Plusieurs valeurs
   au-dessus de 2 g/L sur la semaine méritent d'en parler
   à ton médecin. Au-dessus de 3 g/L avec symptômes
   (nausées, soif intense, haleine inhabituelle) :
   urgence.

▼ Sources
   - HAS — Stratégie thérapeutique du patient vivant
     avec un diabète de type 2, mai 2024
   - Société Francophone du Diabète
   - INSERM — Dossier diabète
```

### Fiche A.11.2 — Comprendre l'HbA1c

```
▼ Qu'est-ce que l'HbA1c ?
   L'HbA1c (hémoglobine glyquée) reflète ta glycémie
   moyenne des 2-3 derniers mois. Elle se mesure par une
   simple prise de sang, sans être à jeun.

▼ Pourquoi est-elle importante ?
   Contrairement à une glycémie ponctuelle (instantanée),
   l'HbA1c donne une vision d'ensemble. C'est elle qui
   prédit les risques de complications à long terme.

▼ Quelle est ta cible ?
   La cible est individualisée par ton médecin :
   • Diabète récent, jeune, sans antécédents : ≤ 6,5%
   • Diabète T2 standard : < 7%
   • Personne âgée fragile ou antécédents CV : ≤ 8%

▼ Les différents cas possibles
   • HbA1c en dessous de la cible
     → Excellent contrôle, ou risque d'hypoglycémies si
       valeur très basse (à voir avec ton médecin)
   • HbA1c au niveau de la cible
     → Diabète bien équilibré
   • HbA1c légèrement au-dessus
     → Diabète à ajuster, ton médecin peut proposer
       un changement de stratégie
   • HbA1c franchement au-dessus (> 8,5%)
     → Diabète déséquilibré, consultation rapide

▼ À quelle fréquence la mesurer ?
   Tous les 3 mois en général. Plus fréquemment en cas
   de changement de traitement ou de déséquilibre.

▼ Sources
   - HAS — Stratégie thérapeutique du patient vivant
     avec un diabète de type 2, mai 2024
   - Fédération Française des Diabétiques
```

### Fiche A.11.3 — Comprendre une hypoglycémie

```
▼ Qu'est-ce qu'une hypoglycémie ?
   C'est une glycémie trop basse, généralement < 0,7 g/L.
   Le cerveau a besoin de sucre pour fonctionner ; quand
   il en manque, des symptômes apparaissent rapidement.

▼ Pourquoi survient-elle ?
   Surtout chez les patients sous insuline ou sulfamides.
   Causes fréquentes :
   • Dose de médicament trop forte par rapport au repas
   • Repas sauté ou retardé
   • Activité physique non prévue
   • Alcool à jeun
   • Erreur de dosage

▼ Les différents niveaux
   • Hypoglycémie modérée (0,5-0,7 g/L)
     → Sueurs, tremblements, faim, palpitations
     → Resucrage rapide suffit
   • Hypoglycémie sévère (< 0,5 g/L)
     → Confusion, vision floue, difficultés à agir
     → Besoin d'aide pour resucrer
   • Hypoglycémie très sévère
     → Troubles de la conscience, convulsions, coma
     → URGENCE — appel du 15

▼ Que faire ?
   1. 15 g de sucre rapide (3 morceaux, 1 verre de jus)
   2. Repos, ne pas conduire
   3. Recontrôle à 15 min
   4. Répéter si toujours bas
   5. Collation à index bas après normalisation
   6. Noter l'épisode pour ton médecin

▼ Comment l'éviter à l'avenir ?
   • Respecter les horaires de prise et de repas
   • Avoir toujours du sucre sur soi
   • Adapter le traitement si activité physique prévue
   • Discuter avec ton médecin des épisodes répétés

▼ Sources
   - HAS — Diabète de type 2, mai 2024
   - Fédération Française des Diabétiques
```

---

# ANNEXE B — Base de connaissances : Hypertension artérielle

*Note : annexe complète disponible également comme document autonome "base_connaissances_HTA_asthme.md"*

## B.1 Définition

L'hypertension artérielle est une pression artérielle élevée et persistante. Asymptomatique dans la grande majorité des cas (« tueur silencieux »).

**En France :** 17 millions d'hypertendus adultes selon Santé publique France. La moitié ignorent l'être. Seulement 1 sur 2 traités atteint les objectifs.

**Premier facteur de risque cardiovasculaire** devant le LDL-cholestérol, le diabète et l'obésité.

## B.2 Classification (ESC 2024)

| Catégorie | Consultation | Automesure | MAPA diurne |
|---|---|---|---|
| PA non élevée | < 120/70 mmHg | < 120/70 mmHg | < 115/75 mmHg |
| PA élevée | 120-139 / 70-89 mmHg | (intermédiaire) | (intermédiaire) |
| HTA | ≥ 140/90 mmHg | ≥ 135/85 mmHg | ≥ 130/80 mmHg |

## B.3 Cibles thérapeutiques (ESC 2024)

**Cible générale :** 120-129 / 70-79 mmHg. Idéal si toléré : 120/70 mmHg. **Plancher : ne pas descendre sous 120/70 mmHg.**

**Profils particuliers :**
- > 85 ans, fragile, hypotension orthostatique : < 140 mmHg systolique
- Diabétique, IRC, prévention secondaire : cible standard ou plus stricte

**Délai d'atteinte :** sous 3 mois.

## B.4 Modalités d'automesure

**Protocole standardisé :**
- 5 min de repos avant
- Position assise, dos appuyé, bras au niveau du cœur
- Brassard adapté
- Pas de café, tabac, exercice 30 min avant
- Vessie vide

**Règle SFHTA "3-3-3" (bilan) :** 3 mesures à 1 min d'intervalle, matin et soir, pendant 3 jours.

**Tensiomètres validés obligatoires** (liste SFHTA). **Les appareils sans brassard ne sont PAS validés.**

## B.5 Symptômes possibles

**L'HTA est généralement asymptomatique.** Les symptômes ci-dessous peuvent survenir mais ne sont ni constants ni spécifiques :
- Maux de tête (surtout au réveil, occipitaux)
- Vertiges, étourdissements
- Bourdonnements d'oreille
- Mouches volantes
- Vision floue
- Saignements de nez (relation discutée)
- Essoufflement à l'effort
- Palpitations
- Troubles du sommeil
- Fatigue

## B.6 Signaux d'urgence — Crise hypertensive

**Seuil : TA ≥ 180/120 mmHg.**

**Distinction :**
- **Élévation simple** (≥ 180/120 mmHg, SANS symptôme grave) → consultation rapide, pas forcément urgences. Repos, remesure après 15-20 min.
- **Urgence hypertensive** (≥ 180/120 mmHg AVEC signes) → **15 immédiat**.

**Signes d'atteinte d'organe nécessitant le 15 :**
- Douleur thoracique intense (infarctus, dissection aortique)
- Difficulté respiratoire intense (OAP)
- Maux de tête intenses et brutaux, inhabituels
- Troubles de la vision soudains
- Confusion, troubles du langage
- Faiblesse / paralysie d'un côté (AVC)
- Nausées, vomissements
- Perte d'équilibre
- Convulsions

## B.7 Hiérarchie d'alerte

**Niveau 1 :** 1 mesure 140-159 / 90-99 mmHg, sans symptôme → observation, remesure.

**Niveau 2 :** Plusieurs mesures > 135/85 sur 3-5 jours OU 1 mesure 160-179 / 100-119 sans symptôme → consultation cette semaine.

**Niveau 3a :** 1 mesure ≥ 180/120 SANS symptôme → consultation rapide / urgences si persistance après repos.

**Niveau 3b :** 1 mesure ≥ 180/120 AVEC signe d'alerte, OU tout signe neurologique brutal même sans mesure → **15 immédiat**.

## B.8 Examens de suivi

**Bilan initial :** bilan biologique (kaliémie, créatininémie, glycémie, bilan lipidique), ECG, rapport albumine/créatinine urinaire, aldostérone+rénine (ESC 2024), fond d'œil si HTA grade 2-3 ou diabète.

**Suivi :** consultation mensuelle jusqu'à atteinte de la cible, puis tous les 3-6 mois. Bilan biologique annuel. ECG annuel. Fond d'œil tous les 1-2 ans.

## B.9 Complications à long terme

- **Cerveau :** AVC (HTA = 1er facteur de risque), AIT, démence vasculaire
- **Cœur :** insuffisance cardiaque, infarctus, mort subite
- **Reins :** insuffisance rénale chronique, dialyse
- **Yeux :** rétinopathie hypertensive
- **Vaisseaux :** athérosclérose, artériopathie

**55 000 décès/an en France attribuables à l'HTA (INSERM).**

## B.10 Vigilances

**Médicaments hyperten­seurs :** AINS, corticoïdes, sprays nasaux décongestionnants, pilule œstroprogestative, réglisse, certains antidépresseurs, stimulants.

**À dépister :** apnée du sommeil, hyperaldostéronisme primaire (6-11% des hypertendus), HTA secondaire si début avant 40 ans ou HTA résistante.

**Modes de vie :** sel < 5 g/j (HAS), activité 30 min × 3/semaine, limite alcool, arrêt tabac, perte de poids si surpoids, gestion du stress.

## B.11 États d'équilibre proposés

| État | Critères |
|---|---|
| Équilibré | Moyenne automesure sur 2 semaines dans la cible (< 135/85). Aucun pic > 150/95. |
| Non équilibré | Moyenne légèrement au-dessus. Quelques valeurs 135-160 / 85-100. |
| Déséquilibre sévère | Plusieurs valeurs > 160/100 sur la semaine, OU 1 valeur > 180/120, OU symptômes répétés. |
| Phase consultation | Suit un déséquilibre, intensification maintenue. |
| Retour à l'équilibre | Tendance favorable confirmée sur 2-3 semaines après ajustement. |

**Indicateur synthétique interne :** moyenne mobile sur 7-14 jours en automesure.

## B.12 Messages-types proposés

**Mesure isolée légèrement haute :**
> "Ta tension est de 145/92 mmHg. Au-dessus de la cible usuelle en automesure (<135/85 mmHg, source HAS / SFHTA). Cette valeur isolée n'est pas alarmante. Vérifie : étais-tu bien au repos 5 minutes avant ? Mesure à nouveau demain matin à jeun. Si plusieurs valeurs restent élevées sur 3-4 jours, contacte ton médecin."

**Mesure très élevée sans symptôme :**
> "Ta tension est de 185/115 mmHg. C'est très au-dessus de la normale. Avant tout : reste calme, allonge-toi 20 minutes dans un endroit calme, puis remesure. Si la valeur reste très élevée OU si tu ressens maux de tête intenses, vision trouble, douleur thoracique, difficulté à parler ou faiblesse d'un côté : appelle le 15 immédiatement. Sinon, contacte ton médecin aujourd'hui."

**Signe d'urgence vitale :**
> "Les signes que tu décris (faiblesse d'un côté du corps, troubles de la parole) sont des signes possibles d'AVC. Appelle le 15 IMMÉDIATEMENT. Ne conduis pas. Reste assis ou allongé. Note l'heure exacte de début des symptômes — c'est très important pour les secours."

## B.13 Exemples de fiches pédagogiques ("En savoir plus")

### Fiche B.13.1 — Comprendre ta tension artérielle

```
▼ Que mesure-t-on quand on prend la tension ?
   Deux valeurs :
   • La systolique (le grand chiffre) : pression
     quand le cœur se contracte et envoie le sang
   • La diastolique (le petit chiffre) : pression
     quand le cœur se relâche entre deux battements

▼ Quels sont les seuils ?
   En automesure à domicile (recommandations ESC 2024) :
   • PA non élevée : < 120/70 mmHg
   • PA élevée : entre 120-139 / 70-89 mmHg
   • Hypertension : ≥ 135/85 mmHg

   Au cabinet médical : seuils 5 mmHg plus haut.

▼ Quelle est la cible si tu es traité ?
   Cible générale : 120-129 / 70-79 mmHg.
   À atteindre sous 3 mois.
   Plancher absolu : ne pas descendre sous 120/70 mmHg.

▼ Pourquoi cette cible ?
   Une tension durablement élevée endommage progressi-
   vement les artères, le cœur, les reins, le cerveau,
   les yeux. La baisser réduit les risques d'AVC,
   d'infarctus, d'insuffisance rénale.

▼ Pourquoi ma tension varie autant ?
   C'est normal. La tension change selon :
   • L'heure de la journée (plus haute le matin)
   • Le stress, les émotions
   • L'activité physique récente
   • La consommation de café, tabac, alcool
   • La position (debout/assis/allongé)
   • La taille du brassard
   C'est pour ça qu'on regarde une moyenne sur plusieurs
   mesures, pas une valeur isolée.

▼ Sources
   - Recommandations ESC 2024
   - Société Française d'Hypertension Artérielle
   - HAS
```

### Fiche B.13.2 — Comprendre la crise hypertensive

```
▼ Qu'est-ce qu'une crise hypertensive ?
   Une élévation rapide et importante de la tension,
   généralement au-delà de 180/120 mmHg.

▼ Y a-t-il toujours urgence ?
   Non. On distingue deux situations :
   • Élévation tensionnelle simple
     TA ≥ 180/120 mais SANS symptôme grave
     → Repos 20 min, remesure, consultation rapide
        (médecin, pas forcément les urgences)
   • Urgence hypertensive vraie
     TA ≥ 180/120 AVEC signes d'atteinte d'organe
     → 15 immédiat

▼ Quels sont les signes d'urgence vraie ?
   • Douleur thoracique intense
   • Difficulté respiratoire majeure
   • Maux de tête intenses et brutaux, inhabituels
   • Troubles visuels soudains
   • Confusion, troubles de la parole
   • Faiblesse d'un côté du corps
   • Convulsions

   Ces signes traduisent une souffrance du cerveau,
   du cœur ou des reins. Chaque minute compte.

▼ Que faire en attendant ?
   • Reste calme, allongé
   • Ne prends pas un médicament en plus sans avis
     médical
   • Ne baisse pas la tension trop vite : c'est
     dangereux pour le cerveau
   • Note les symptômes et leur heure de début

▼ Sources
   - Recommandations ESC 2024
   - HAS — HTA sévère et urgences hypertensives
```

---

# ANNEXE C — Base de connaissances : Asthme de l'adulte

*Note : annexe complète disponible également comme document autonome "base_connaissances_HTA_asthme.md"*

## C.1 Définition

Maladie chronique inflammatoire des bronches, avec hyperréactivité bronchique. Épisodes d'obstruction bronchique réversibles.

**En France :** environ 4 millions d'asthmatiques, dont 600 000 asthme sévère.

**Symptômes cardinaux :** sifflements (wheezing), dyspnée, oppression thoracique, toux (souvent sèche, nocturne ou à l'effort).

## C.2 Évaluation du contrôle (outil central GINA)

**Test GINA sur les 4 dernières semaines, 4 questions :**
1. Symptômes d'asthme > 2 fois par semaine ?
2. Réveil nocturne dû à l'asthme ?
3. Bronchodilatateur de secours > 2 fois par semaine ?
4. Activités limitées par l'asthme ?

| Réponses "Oui" | Statut |
|---|---|
| 0 | Bien contrôlé |
| 1-2 | Partiellement contrôlé |
| 3-4 | Non contrôlé |

**Outils complémentaires :** ACT (score > 20 = bien contrôlé), ACQ (score > 1,5 = mauvais contrôle).

## C.3 Indicateur clé : usage du SABA

- > 2 utilisations/semaine = asthme non contrôlé
- > 1 boîte de salbutamol équivalent/mois = signal d'alarme
- > 12 utilisations/mois = facteur de risque d'exacerbation grave

**Important (GINA 2019+) :** SABA seul déconseillé. Traitement recommandé : CSI + formotérol à la demande.

## C.4 Facteurs déclenchants

**Allergéniques :** pollens, acariens, phanères d'animaux, moisissures, sulfites.

**Atopie associée :** dermatite atopique, rhinite allergique (80% des asthmatiques).

**Irritants :** tabac (actif/passif), cigarette électronique (aggrave selon GINA 2022), pollution, sprays, parfums.

**Respiratoires :** infections virales (cause majeure d'exacerbations), RGO, insuffisance cardiaque, BPCO.

**Environnementaux :** air froid et sec, effort, stress, variations climatiques.

**Médicamenteux :** bêta-bloquants non cardio-sélectifs, AINS/aspirine (syndrome de Widal).

**Professionnels (15-20% des asthmes) :** boulangerie, coiffure, BTP, alimentaire — amélioration en vacances = indice.

## C.5 Exacerbations

**Définition :** majoration des symptômes pendant > 48h, nécessitant modification du traitement habituel.

**Critère objectif :** chute du DEP matinal ≥ 15% par rapport à la meilleure valeur personnelle.

**Non sévère :** répond au SABA + CSI augmentés. DEP 50-80%.

**Sévère :** nécessite corticoïdes oraux, urgences ou hospitalisation. DEP < 50%.

## C.6 Signaux d'urgence — Asthme aigu grave (AAG)

**À connaître par patient et proches (SPLF, GINA) :**

**Signes nécessitant le 15 immédiat :**
- Troubles de la vigilance, agitation
- Sueurs profuses
- **Impossibilité de parler par phrases** (parle par mots isolés)
- Difficulté respiratoire en position allongée (orthopnée)
- Pauses respiratoires
- Polypnée > 30 cycles/min
- **Cyanose** (lèvres, doigts bleutés)
- Tachycardie > 110 bpm
- **DEP < 30%** valeur théorique/personnelle
- Désaturation O2
- SABA inefficace après 1-2 prises

**Conduite avant les secours :**
- Position assise, dos droit
- 4 bouffées de SABA toutes les 10 min pendant 1h
- Pas d'AINS, pas de sédatifs

## C.7 Hiérarchie d'alerte

**Niveau 1 :** Symptômes occasionnels, SABA 1-2/semaine → continuer traitement, observer.

**Niveau 2a :** Test GINA 1-2/4, SABA 2-3/semaine → vérification technique, identification déclencheurs.

**Niveau 2b :** Test GINA 3-4/4, SABA > 2/semaine répété, 1 boîte de SABA en < 1 mois → consultation cette semaine.

**Niveau 3a :** Crise débutante ne cédant pas après 1ère prise SABA, DEP 50-80% → plan d'urgence, 4 bouffées SABA, médecin ou 15 si pas d'amélioration en 20-30 min.

**Niveau 3b (15) :** Crise ne cédant pas au SABA après 1h, DEP < 50%, signes d'AAG → **15 immédiat**.

## C.8 Plan d'action écrit (PAA) — Central

**Zone verte :** pas de symptômes, DEP > 80%. Continuer traitement de fond.

**Zone orange :** symptômes ou DEP 50-80%. Augmenter SABA et CSI. Consulter sous 24-48h si pas d'amélioration.

**Zone rouge :** DEP < 50% ou symptômes sévères. SABA en répétition (4 bouffées × 3 toutes les 10 min). Corticoïdes oraux selon plan. **Appel du 15.**

## C.9 Examens de suivi

**Consultation :** tous les 3-6 mois si bien contrôlé, plus fréquent sinon.

**EFR (spirométrie) :** à chaque ajustement majeur, au moins annuelle.

**Bilan allergologique :** à l'inclusion, à refaire si évolution.

**Vaccinations :** grippe annuelle (obligatoire), pneumocoque (ALD asthme), COVID.

**Si mauvais contrôle persistant :**
- Vérification observance + technique d'inhalation (priorité)
- Recherche comorbidités (rhinite, RGO, apnée)
- Recherche asthme professionnel
- Référent pneumologue

## C.10 Vigilances

**Médicaments :** bêta-bloquants non cardio-sélectifs, AINS/aspirine (Widal), antitussifs.

**Modes de vie :** arrêt du tabac impératif, éviction allergénique, maintien activité physique, **80% des patients utilisent mal leur inhalateur** (GINA 2023) → vérifier annuellement.

**Facteurs aggravants méconnus :** cigarette électronique, stress chronique, apnée du sommeil, RGO non traité, obésité.

## C.11 États d'équilibre proposés

| État | Critères |
|---|---|
| Équilibré | GINA 0/4. SABA ≤ 1/semaine. Pas d'exacerbation depuis 3 mois. DEP > 80%. |
| Non équilibré | GINA 1-2/4. SABA 2-4/semaine. Quelques nuits perturbées. |
| Déséquilibre sévère | GINA 3-4/4. SABA > 2/semaine. Exacerbation récente. DEP < 80%. |
| Phase consultation | Ajustement thérapeutique en cours. |
| Retour à l'équilibre | Amélioration des critères sur 4-6 semaines. |

**Indicateur synthétique interne :** nombre d'utilisations SABA / semaine glissante + score GINA mensuel.

## C.12 Messages-types proposés

**Usage modéré de SABA :**
> "Tu as utilisé ton bronchodilatateur 3 fois cette semaine. Selon les recommandations GINA, plus de 2 utilisations par semaine indiquent que ton asthme n'est pas optimalement contrôlé. Ça ne veut pas dire que c'est grave aujourd'hui. Vérifie ta technique d'inhalation, identifie ce qui a déclenché, et si ça continue, parle à ton médecin."

**Asthme non contrôlé GINA :**
> "Cette semaine, tu as répondu OUI à 3 questions sur 4 sur ton asthme (symptômes, réveil nocturne, gêne dans tes activités). Selon les critères GINA, cela suggère un asthme non contrôlé. Contacte ton médecin dans la semaine pour faire le point."

**Signes d'asthme aigu grave :**
> "Les signes que tu décris (difficulté à parler par phrases, sueurs, lèvres bleues, bronchodilatateur inefficace) sont des signaux d'asthme aigu grave. **Appelle le 15 IMMÉDIATEMENT.** Reste en position assise, dos droit. Continue les bouffées de bronchodilatateur en attendant les secours."

## C.13 Exemples de fiches pédagogiques ("En savoir plus")

### Fiche C.13.1 — Comprendre le contrôle de ton asthme

```
▼ Qu'est-ce qu'un asthme contrôlé ?
   Un asthme est dit "contrôlé" quand il te permet de
   vivre normalement, sans symptômes gênants, sans
   crise, sans limitation d'activité.

▼ Comment le mesure-t-on ?
   Avec le test GINA, 4 questions sur les 4 dernières
   semaines :
   1. Symptômes d'asthme > 2 fois par semaine ?
   2. Réveil nocturne dû à l'asthme ?
   3. Usage du bronchodilatateur > 2 fois par semaine ?
   4. Activités limitées par l'asthme ?

   • 0 réponse OUI → asthme bien contrôlé
   • 1-2 réponses OUI → partiellement contrôlé
   • 3-4 réponses OUI → non contrôlé

▼ Pourquoi c'est important ?
   Un asthme non contrôlé augmente le risque
   d'exacerbations (crises) sévères, parfois graves.
   Identifier rapidement un mauvais contrôle permet
   d'ajuster le traitement avant la crise.

▼ Les différents cas possibles si mal contrôlé
   • Mauvaise technique d'inhalation
     → 80% des patients utilisent mal leur inhalateur
   • Mauvaise observance du traitement de fond
   • Facteur déclenchant non identifié (allergène,
     reflux, infection récurrente)
   • Traitement de fond insuffisant
   • Comorbidité (rhinite, RGO, apnée du sommeil)

▼ Sources
   - GINA 2024 (Global Initiative for Asthma)
   - SPLF — Recommandations 2021
   - Ameli.fr — Asthme adulte
```

### Fiche C.13.2 — Comprendre l'usage du bronchodilatateur de secours

```
▼ À quoi sert le bronchodilatateur de secours (SABA) ?
   Il relâche rapidement les muscles autour des
   bronches, permettant à l'air de passer mieux.
   Effet en quelques minutes. Durée : 4-6 heures.

▼ Pourquoi compter les utilisations ?
   La fréquence d'usage du SABA est un excellent
   indicateur du contrôle de l'asthme. Plus tu l'utilises,
   moins ton asthme est contrôlé.

▼ Les seuils à connaître
   • ≤ 2 fois par semaine : asthme contrôlé
   • > 2 fois par semaine : asthme non contrôlé
   • > 1 boîte par mois : signal d'alarme important
   • > 12 utilisations par mois : risque d'exacerbation
     grave

▼ Pourquoi utiliser le SABA seul est-il déconseillé ?
   Depuis 2019, GINA recommande de ne plus utiliser le
   SABA seul, même chez l'asthmatique léger. Le
   traitement préféré est l'association CSI + formotérol
   à la demande. L'usage isolé prolongé de SABA est
   associé à un risque accru de décès par asthme.

▼ Que faire si tu en utilises trop ?
   Pas de panique. Ce n'est pas le SABA qui est
   dangereux, c'est ce qu'il révèle : un asthme qui
   n'est pas suffisamment contrôlé par le traitement
   de fond.
   • Vérifie ta technique d'inhalation
   • Vérifie l'observance de ton traitement de fond
   • Cherche un déclencheur récent (rhume, allergène,
     stress, tabac)
   • Parle-en à ton médecin pour réévaluer le
     traitement

▼ Sources
   - GINA 2024
   - SPLF — Recommandations 2021
   - VIDAL — Asthme de l'adulte
```

---

# ANNEXE D — Guide d'entretien pour validation médicale

*Outil opérationnel pour conduire les entretiens avec les médecins en charge de valider la base de connaissances.*

## D.1 Principes d'utilisation

Ce guide est un **outil de travail**, pas une vérité absolue. Il a été construit à partir des sources publiques officielles. Un médecin spécialiste peut juger qu'une question manque, qu'une formulation est imprécise, ou qu'une approche est incomplète.

**Recommandation forte :** présenter ouvertement le guide au médecin **au début de l'entretien** en lui demandant de le valider et compléter. Cette franchise est appréciée et joue en faveur de la qualité de l'échange.

## D.2 Présentation du projet (à lire au médecin, 2-3 minutes)

> *"Je développe une application mobile d'accompagnement médical pour les patients atteints de pathologies chroniques (diabète, hypertension, asthme dans un premier temps).*
>
> *L'app ne se substitue jamais au médecin. Elle a une ligne déontologique stricte : elle ne touche jamais à la thérapeutique, elle ne prescrit pas, elle ne modifie pas de dosage. Elle suggère des actions d'observation et d'hygiène de vie, et oriente le patient vers son médecin ou les urgences quand c'est nécessaire.*
>
> *Concrètement, l'app fait quatre choses :*
> *— Elle rappelle au patient de prendre ses médicaments et de faire ses mesures, en s'adaptant à son rythme de vie réel.*
> *— Elle observe les valeurs (glycémie, tension, etc.) et alerte selon des seuils issus des recommandations officielles, en citant ses sources.*
> *— Elle répond aux symptômes que le patient rapporte, en croisant avec ses pathologies déclarées, et propose des tests ou suggère de consulter.*
> *— Elle prépare la consultation médicale avec un rapport de synthèse.*
>
> *Je viens vers vous pour valider la base de connaissances de l'app sur [pathologie]. Avant qu'on commence, je vous propose de regarder ensemble les questions que je voulais vous poser. Vous me direz lesquelles sont pertinentes, lesquelles ne le sont pas, et ce qui manque selon vous."*

## D.3 Structure générale d'un entretien

L'entretien est structuré en 13 sections pour chaque pathologie :

1. Définition et classification
2. Objectifs / cibles thérapeutiques
3. Modalités d'autosurveillance
4. Symptômes à surveiller
5. Signaux d'urgence
6. Hiérarchie d'alerte (les 4 niveaux)
7. Examens de suivi
8. Vigilances et interactions
9. Plan d'urgence standard
10. États d'équilibre dynamiques
11. Indicateur synthétique interne
12. Messages-types (validation de formulation)
13. Question ouverte de fin (« qu'est-ce que j'ai oublié ? »)

Pour chaque section, le guide propose **les informations issues des sources publiques** et demande au médecin de :
- **Valider** ce qui est juste
- **Corriger** ce qui est imprécis
- **Compléter** ce qui manque (lié à sa pratique clinique)

## D.4 Questions transversales (en fin d'entretien)

**Sur la collaboration :**
- Seriez-vous intéressé pour collaborer durablement ? Sous quelle forme (relecture périodique, comité scientifique, prestations) ?
- Quel tarif vous semble juste pour cette prestation ?

**Sur le périmètre :**
- Y a-t-il des patients pour qui l'app ne serait clairement pas adaptée ?
- Voyez-vous des risques médico-légaux que je n'aurais pas anticipés ?

**Sur l'adoption médicale :**
- Si un de vos patients arrivait en consultation avec un rapport de l'app, comment le percevriez-vous ?
- Seriez-vous prêt à recommander l'app à certains de vos patients ?

## D.5 Conseils pratiques de conduite d'entretien

**Avant :**
- Envoyer le guide en avance par email
- Préciser la durée : 60 à 90 minutes
- Confirmer la rémunération si prestation payante

**Pendant :**
- Ouvrir avec la présentation du projet
- Demander explicitement la validation du guide
- Prendre des notes structurées par section
- Demander des exemples cliniques concrets si flou
- Garder du temps pour les questions ouvertes

**Après :**
- Compte-rendu écrit envoyé au médecin pour validation finale
- Demander accord pour citation comme contributeur
- Prévoir une seconde session après mise à jour

## D.6 Document complet du guide

Le guide complet (questions détaillées section par section pour l'hypertension et l'asthme) est disponible dans le document autonome **`guide_entretien_medecins_HTA_asthme.md`** fourni en parallèle.

Pour le **diabète type 2**, le guide n'a pas été produit dans cette version car le porteur du projet a une connaissance personnelle de la pathologie. Une version pourra être produite ultérieurement sur le même modèle si besoin de validation médicale supplémentaire.

---

---

*Document de conception v0.7 — Version finale.*

*Cette version intègre :*
- *La spécification produit complète (16 sections)*
- *Le principe de transparence pédagogique (section 2.7)*
- *Les bases de connaissances pour trois pathologies (annexes A, B, C) avec exemples de fiches pédagogiques*
- *Le guide d'entretien pour validation médicale (annexe D)*

*Ce document constitue un livrable consolidé prêt à servir de base pour :*
- *Le développement technique du produit*
- *La validation médicale humaine de la base de connaissances*
- *La présentation à un cofondateur, développeur, médecin partenaire ou investisseur*

*L'étape critique restante avant mise en production est la validation médicale humaine, comme posé par le principe 2.6.*
