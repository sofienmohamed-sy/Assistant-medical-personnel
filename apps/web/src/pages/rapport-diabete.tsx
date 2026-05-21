import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Printer } from 'lucide-react';
import {
  ALERT_LEVEL_LABELS_FR,
  buildPeriod,
  computeDiabeteRapport,
  COUNTRY_LABELS_FR,
  DIABETE_SYMPTOM_CATEGORY_LABELS_FR,
  DIABETE_T2_PROFILE_LABELS_FR,
  RAPPORT_PERIOD_PRESETS,
  type DiabeteSymptomCategory,
  type RapportPeriodCode,
} from '@shared/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGlycemiaMeasurements } from '@/hooks/use-measurements';
import { useHbA1cMeasurements } from '@/hooks/use-hba1c';
import { useDiabeteSymptomReports } from '@/hooks/use-symptoms';
import { useUserDoc } from '@/hooks/use-profile';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const longDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

function formatGperL(v: number | null): string {
  if (v == null) return '—';
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g/L`;
}

function formatPercent(v: number | null): string {
  if (v == null) return '—';
  return `${Math.round(v * 100)} %`;
}

export default function RapportDiabetePage() {
  const userDoc = useUserDoc();
  const glycemia = useGlycemiaMeasurements({ max: 500 });
  const symptoms = useDiabeteSymptomReports({ max: 200 });
  const hba1c = useHbA1cMeasurements({ max: 30 });
  const [periodCode, setPeriodCode] = useState<RapportPeriodCode>('4w');

  const period = useMemo(() => buildPeriod(periodCode), [periodCode]);

  const treatmentProfile = userDoc.data?.pathologies.diabeteT2?.treatmentProfile ?? 'B';
  const isLoading =
    userDoc.isLoading || glycemia.isLoading || symptoms.isLoading || hba1c.isLoading;

  const rapport = useMemo(() => {
    if (isLoading) return null;
    return computeDiabeteRapport({
      period,
      treatmentProfile,
      measurements: (glycemia.data ?? []).map((m) => ({
        measuredAt: m.measuredAt,
        value: m.value,
        moment: m.moment,
      })),
      symptomReports: (symptoms.data ?? []).map((r) => ({
        reportedAt: r.reportedAt,
        symptoms: r.symptoms,
      })),
      hba1cMeasurements: (hba1c.data ?? []).map((h) => ({
        measuredAt: h.measuredAt,
        value: h.value,
        labName: h.labName,
      })),
    });
  }, [glycemia.data, hba1c.data, isLoading, period, symptoms.data, treatmentProfile]);

  const profile = userDoc.data?.profile;
  const generatedAt = useMemo(() => new Date(), []);

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6 print:bg-white print:p-0">
      <Card
        className="w-full max-w-3xl print:rounded-none print:border-0 print:shadow-none"
        data-testid="rapport-card"
      >
        <CardHeader className="print:pb-2">
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full print:hidden">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Rapport médecin — Diabète T2</CardTitle>
          <CardDescription>
            Résumé à imprimer ou exporter en PDF avant ta prochaine consultation. C&apos;est un
            assemblage de tes propres saisies&nbsp;: il n&apos;y a aucun diagnostic ni
            recommandation thérapeutique.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls — hidden in print */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button asChild variant="outline">
              <Link to="/app">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Retour
              </Link>
            </Button>
            <div
              className="border-input flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
              data-testid="rapport-period-picker"
            >
              <label htmlFor="rapport-period-select" className="text-muted-foreground">
                Période&nbsp;:
              </label>
              <select
                id="rapport-period-select"
                value={periodCode}
                onChange={(e) => setPeriodCode(e.target.value as RapportPeriodCode)}
                className="bg-transparent text-sm focus-visible:outline-none"
              >
                {RAPPORT_PERIOD_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.labelFr}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => window.print()}
              className="ml-auto"
              data-testid="rapport-print-cta"
            >
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
              Imprimer / Exporter en PDF
            </Button>
          </div>

          {isLoading && (
            <div
              className="text-muted-foreground flex items-center gap-2 text-sm"
              data-testid="rapport-loading"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Assemblage du rapport…
            </div>
          )}

          {rapport && (
            <div className="text-foreground space-y-6 text-sm leading-relaxed">
              {/* Header block, always visible incl. print */}
              <section data-testid="rapport-header" className="border-border border-b pb-3">
                <p className="text-muted-foreground text-xs">
                  Rapport généré le {longDateFormatter.format(generatedAt)}.
                </p>
                <p className="text-muted-foreground text-xs">
                  Période couverte&nbsp;:{' '}
                  <span className="text-foreground font-medium">
                    du {dateFormatter.format(new Date(rapport.period.startMs))} au{' '}
                    {dateFormatter.format(new Date(rapport.period.endMs))}
                  </span>
                  .
                </p>
              </section>

              {/* Identité */}
              <section data-testid="rapport-identity">
                <h2 className="text-base font-semibold">Identité</h2>
                {profile ? (
                  <dl className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    <RapportRow label="Prénom, nom" value={`${profile.prenom} ${profile.nom}`} />
                    <RapportRow
                      label="Date de naissance"
                      value={profile.dateOfBirth}
                      testId="rapport-dob"
                    />
                    <RapportRow
                      label="Profession"
                      value={profile.profession}
                      testId="rapport-profession"
                    />
                    <RapportRow
                      label="Pays de résidence"
                      value={COUNTRY_LABELS_FR[profile.countryOfResidence]}
                      testId="rapport-country"
                    />
                  </dl>
                ) : (
                  <p className="text-muted-foreground">Profil non renseigné.</p>
                )}
              </section>

              {/* Pathologie */}
              <section data-testid="rapport-pathology">
                <h2 className="text-base font-semibold">Diabète T2 — profil de traitement</h2>
                <p>
                  Profil <span className="font-medium">{rapport.treatmentProfile}</span> —{' '}
                  {DIABETE_T2_PROFILE_LABELS_FR[rapport.treatmentProfile]}
                </p>
              </section>

              {/* Glycémie summary */}
              <section data-testid="rapport-glycemia">
                <h2 className="text-base font-semibold">Glycémie — résumé</h2>
                {rapport.glycemia.count === 0 ? (
                  <p className="text-muted-foreground">Aucune glycémie saisie sur la période.</p>
                ) : (
                  <dl className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    <RapportRow
                      label="Nombre de mesures"
                      value={String(rapport.glycemia.count)}
                      testId="rapport-glyc-count"
                    />
                    <RapportRow
                      label="Part dans la cible"
                      value={formatPercent(rapport.glycemia.inTargetRatio)}
                      testId="rapport-glyc-in-target"
                    />
                    <RapportRow label="Moyenne" value={formatGperL(rapport.glycemia.meanGperL)} />
                    <RapportRow
                      label="Min / Max"
                      value={`${formatGperL(rapport.glycemia.minGperL)} / ${formatGperL(rapport.glycemia.maxGperL)}`}
                    />
                    <RapportRow
                      label="Valeurs > 2 g/L"
                      value={String(rapport.glycemia.highValueCount)}
                      testId="rapport-glyc-high"
                    />
                    <RapportRow
                      label="Épisodes hypoglycémie marquée"
                      value={String(rapport.glycemia.severeHypoCount)}
                      testId="rapport-glyc-hypo"
                    />
                  </dl>
                )}
                {rapport.glycemia.count > 0 && (
                  <div className="mt-3" data-testid="rapport-glyc-levels">
                    <p className="text-muted-foreground text-xs font-medium">
                      Répartition par niveau d&apos;alerte
                    </p>
                    <ul className="mt-1 grid gap-y-0.5 sm:grid-cols-2">
                      {(['normal', 'level1', 'level2', 'level3a', 'level3b'] as const).map(
                        (level) => (
                          <li key={level} className="flex justify-between gap-3 text-sm">
                            <span>{ALERT_LEVEL_LABELS_FR[level]}</span>
                            <span className="font-medium">
                              {rapport.glycemia.countByLevel[level]}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </section>

              {/* HbA1c */}
              <section data-testid="rapport-hba1c">
                <h2 className="text-base font-semibold">HbA1c — historique</h2>
                {rapport.hba1cHistory.length === 0 ? (
                  <p className="text-muted-foreground">Aucune HbA1c enregistrée.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {rapport.hba1cHistory.map((h) => (
                      <li
                        key={h.measuredAt}
                        className="flex justify-between gap-3"
                        data-testid={`rapport-hba1c-row-${h.measuredAt}`}
                      >
                        <span>
                          {dateFormatter.format(new Date(h.measuredAt))}
                          {h.labName ? ` — ${h.labName}` : ''}
                        </span>
                        <span className="font-medium">
                          {h.value.toLocaleString('fr-FR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}{' '}
                          %
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Symptômes */}
              <section data-testid="rapport-symptoms">
                <h2 className="text-base font-semibold">Symptômes signalés</h2>
                {rapport.symptoms.reportCount === 0 ? (
                  <p className="text-muted-foreground">
                    Aucun signalement de symptôme sur la période.
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">{rapport.symptoms.reportCount}</span>{' '}
                      signalement{rapport.symptoms.reportCount > 1 ? 's' : ''} — niveau le plus
                      élevé observé&nbsp;:{' '}
                      <span className="font-medium">
                        {ALERT_LEVEL_LABELS_FR[rapport.symptoms.worstLevel]}
                      </span>
                      .
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {(Object.keys(rapport.symptoms.byCategory) as DiabeteSymptomCategory[]).map(
                        (cat) => (
                          <li
                            key={cat}
                            className="flex justify-between gap-3"
                            data-testid={`rapport-symptom-${cat}`}
                          >
                            <span>{DIABETE_SYMPTOM_CATEGORY_LABELS_FR[cat]}</span>
                            <span className="font-medium">{rapport.symptoms.byCategory[cat]}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </>
                )}
              </section>

              <p
                className={cn(
                  'border-border text-muted-foreground border-t pt-3 text-xs',
                  'print:text-black',
                )}
              >
                Ce rapport est généré à partir des saisies de l&apos;utilisateur·trice. Il
                n&apos;est ni un diagnostic, ni un avis médical. Les seuils cités proviennent des
                références HAS / SFD et restent en attente de validation médicale.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function RapportRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2" data-testid={testId}>
      <dt className="text-muted-foreground">{label}&nbsp;:</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
