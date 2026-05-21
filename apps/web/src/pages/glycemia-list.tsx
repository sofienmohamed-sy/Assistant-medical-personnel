import { Link } from 'react-router-dom';
import { Droplet, Loader2, Plus, ArrowLeft, FlaskConical } from 'lucide-react';
import {
  ALERT_LEVEL_LABELS_FR,
  computeGlycemiaAlert,
  computeGlycemiaTendance,
  getFicheForReason,
  GLYCEMIA_MOMENT_LABELS_FR,
  type AlertLevel,
  type DiabeteT2Profile,
} from '@shared/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertBadge } from '@/components/alerts/alert-badge';
import { FicheDisclosure } from '@/components/alerts/fiche-disclosure';
import { useGlycemiaMeasurements } from '@/hooks/use-measurements';
import { useUserDoc } from '@/hooks/use-profile';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatValue(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function GlycemiaListPage() {
  const measurements = useGlycemiaMeasurements({ max: 50 });
  const userDoc = useUserDoc();

  // If the user has no diabète T2 active anymore (e.g. they unchecked it),
  // we still show the list, but use a conservative "B" (no hypo risk) so the
  // engine doesn't flag 0.65 g/L as level 3a for a non-insulin user.
  const treatmentProfile: DiabeteT2Profile =
    userDoc.data?.pathologies.diabeteT2?.treatmentProfile ?? 'B';

  const classified = (measurements.data ?? []).map((m) => {
    const alert = computeGlycemiaAlert({ value: m.value, moment: m.moment }, treatmentProfile);
    return { ...m, alert };
  });

  const tendance =
    classified.length > 0
      ? computeGlycemiaTendance({
          classified: classified.map((m) => ({
            measuredAt: m.measuredAt,
            value: m.value,
            level: m.alert.level,
          })),
        })
      : null;

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="glycemia-list-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Droplet className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Mes glycémies</CardTitle>
          <CardDescription>
            Les 50 dernières mesures, les plus récentes en premier. La classification est issue des
            seuils HAS / SFD — en attente de validation médicale finale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/app">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Retour
              </Link>
            </Button>
            <Button asChild className="flex-1" data-testid="glycemia-new-cta">
              <Link to="/measurements/glycemia/new">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Nouvelle mesure
              </Link>
            </Button>
          </div>

          {tendance && tendance.totalLast7Days > 0 && (
            <TendanceCard
              level={tendance.maxLevelLast7Days}
              total={tendance.totalLast7Days}
              abnormal={tendance.abnormalLast7Days}
              highRepeated={tendance.highValueRepeatedAlertActive}
              highValueCount={tendance.highValueCountLast7Days}
            />
          )}

          {measurements.isLoading && (
            <div
              className="text-muted-foreground flex items-center gap-2 text-sm"
              data-testid="glycemia-loading"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement…
            </div>
          )}

          {measurements.isError && (
            <p
              role="alert"
              data-testid="glycemia-list-error"
              className="text-destructive text-sm font-medium"
            >
              Impossible de charger tes mesures pour le moment.
              <Button
                onClick={() => measurements.refetch()}
                variant="link"
                className="ml-2 h-auto p-0"
              >
                Réessayer
              </Button>
            </p>
          )}

          {measurements.data && measurements.data.length === 0 && (
            <p data-testid="glycemia-empty" className="text-muted-foreground text-sm">
              Aucune mesure pour l’instant. Saisis-en une pour commencer ton suivi.
            </p>
          )}

          {classified.length > 0 && (
            <ul className="divide-border divide-y" data-testid="glycemia-list">
              {classified.map((m) => (
                <li key={m.id} className="py-3" data-testid={`glycemia-row-${m.id}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <span className="text-foreground text-lg font-semibold">
                        {formatValue(m.value)} g/L
                      </span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {GLYCEMIA_MOMENT_LABELS_FR[m.moment]}
                      </span>
                    </div>
                    <time
                      dateTime={m.measuredAt}
                      className="text-muted-foreground text-xs"
                      data-testid="glycemia-row-time"
                    >
                      {dateFormatter.format(new Date(m.measuredAt))}
                    </time>
                  </div>
                  <div className="mt-1">
                    <AlertBadge level={m.alert.level} compact />
                  </div>
                  {m.alert.level !== 'normal' && (
                    <p
                      className="text-foreground mt-1 text-sm"
                      data-testid={`glycemia-row-alert-${m.id}`}
                    >
                      <span className="font-medium">{m.alert.title}.</span>{' '}
                      <span className="text-muted-foreground">{m.alert.recommendation}</span>
                    </p>
                  )}
                  {(() => {
                    const fiche = getFicheForReason(m.alert.reasonCode);
                    if (!fiche) return null;
                    return (
                      <FicheDisclosure
                        fiche={fiche}
                        className="mt-2"
                        testId={`glycemia-row-fiche-${m.id}`}
                      />
                    );
                  })()}
                  {m.note && (
                    <p
                      className="text-muted-foreground mt-1 text-sm"
                      data-testid="glycemia-row-note"
                    >
                      {m.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

interface TendanceCardProps {
  level: AlertLevel;
  total: number;
  abnormal: number;
  highRepeated: boolean;
  highValueCount: number;
}

function TendanceCard({ level, total, abnormal, highRepeated, highValueCount }: TendanceCardProps) {
  return (
    <div className="border-border bg-muted/40 rounded-lg border p-4" data-testid="tendance-summary">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="text-primary h-4 w-4" aria-hidden="true" />
          Tendance — 7 derniers jours
        </h2>
        <AlertBadge level={level} compact />
      </div>
      <ul className="text-muted-foreground space-y-1 text-sm">
        <li>
          <span className="text-foreground font-medium">{total}</span>{' '}
          {total > 1 ? 'mesures saisies' : 'mesure saisie'}, dont{' '}
          <span className="text-foreground font-medium">{abnormal}</span>{' '}
          {abnormal > 1 ? 'hors cible' : 'hors cible'}.
        </li>
        {highRepeated && (
          <li className="text-foreground">
            <span className="font-medium">Signal de répétition&nbsp;:</span> {highValueCount}{' '}
            mesures &gt; 2 g/L sur la semaine. Il est temps d’en parler à ton médecin.
          </li>
        )}
        <li className="text-xs">
          Niveau le plus élevé observé&nbsp;:{' '}
          <span className="font-medium">{ALERT_LEVEL_LABELS_FR[level]}</span>.
        </li>
      </ul>
    </div>
  );
}
