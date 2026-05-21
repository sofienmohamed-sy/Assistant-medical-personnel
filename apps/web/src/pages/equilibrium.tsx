import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Loader2 } from 'lucide-react';
import {
  computeDiabeteEquilibrium,
  explainEquilibriumPresence,
  type DiabeteT2Profile,
} from '@shared/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlycemiaMeasurements } from '@/hooks/use-measurements';
import { useDiabeteSymptomReports } from '@/hooks/use-symptoms';
import { useUserDoc } from '@/hooks/use-profile';

const MAX_MEASUREMENTS = 200; // ~6 measurements/day over 30 days
const MAX_SYMPTOM_REPORTS = 50;

export default function EquilibriumPage() {
  const userDoc = useUserDoc();
  const measurements = useGlycemiaMeasurements({ max: MAX_MEASUREMENTS });
  const reports = useDiabeteSymptomReports({ max: MAX_SYMPTOM_REPORTS });

  const treatmentProfile: DiabeteT2Profile =
    userDoc.data?.pathologies.diabeteT2?.treatmentProfile ?? 'B';

  const isLoading = userDoc.isLoading || measurements.isLoading || reports.isLoading;
  const hasError = userDoc.isError || measurements.isError || reports.isError;

  const result =
    !isLoading && !hasError
      ? computeDiabeteEquilibrium({
          measurements: (measurements.data ?? []).map((m) => ({
            measuredAt: m.measuredAt,
            value: m.value,
            moment: m.moment,
          })),
          symptomReports: (reports.data ?? []).map((r) => ({
            reportedAt: r.reportedAt,
            symptoms: r.symptoms,
          })),
          treatmentProfile,
        })
      : null;

  const presence = result ? explainEquilibriumPresence(result.state) : null;

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="equilibrium-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Pourquoi l&apos;app me parle comme ça en ce moment&nbsp;?</CardTitle>
          <CardDescription>
            Voici les éléments que l&apos;app a notés ces 30 derniers jours. Aucune étiquette
            n&apos;est attribuée à ton suivi — ce sont juste des faits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div
              className="text-muted-foreground flex items-center gap-2 text-sm"
              data-testid="equilibrium-loading"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Calcul en cours…
            </div>
          )}

          {hasError && (
            <p
              role="alert"
              data-testid="equilibrium-error"
              className="text-destructive text-sm font-medium"
            >
              Impossible de charger ton suivi pour le moment.
            </p>
          )}

          {presence && (
            <section
              className="border-border bg-muted/40 rounded-lg border p-4"
              data-testid="equilibrium-presence"
            >
              <h2 className="text-foreground text-sm font-semibold">{presence.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{presence.body}</p>
            </section>
          )}

          {result && result.signals.length > 0 && (
            <section data-testid="equilibrium-signals">
              <h2 className="text-foreground mb-2 text-sm font-semibold">
                Ce que l&apos;app a observé
              </h2>
              <ul className="text-foreground list-disc space-y-1 pl-5 text-sm">
                {result.signals.map((s) => (
                  <li key={s.code} data-testid={`equilibrium-signal-${s.code}`}>
                    {s.fr}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-muted-foreground text-xs">
            Cette analyse n&apos;est pas un diagnostic. Elle reflète seulement ce que l&apos;app
            voit dans tes saisies. Pour toute décision médicale, parles-en avec ton médecin.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/app">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Retour
              </Link>
            </Button>
            <Button asChild variant="link" className="h-auto p-0">
              <Link to="/measurements/glycemia">Voir mes glycémies →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
