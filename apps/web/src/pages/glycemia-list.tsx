import { Link } from 'react-router-dom';
import { Droplet, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { GLYCEMIA_MOMENT_LABELS_FR } from '@shared/measurements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlycemiaMeasurements } from '@/hooks/use-measurements';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatValue(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function GlycemiaListPage() {
  const measurements = useGlycemiaMeasurements({ max: 50 });

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="glycemia-list-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Droplet className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Mes glycémies</CardTitle>
          <CardDescription>Les 50 dernières mesures, les plus récentes en premier.</CardDescription>
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

          {measurements.data && measurements.data.length > 0 && (
            <ul className="divide-border divide-y" data-testid="glycemia-list">
              {measurements.data.map((m) => (
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
