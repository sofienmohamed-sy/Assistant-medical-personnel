import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHbA1cMeasurements } from '@/hooks/use-hba1c';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function formatValue(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatDelta(delta: number): string {
  if (delta === 0) return 'identique au précédent';
  const abs = Math.abs(delta).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${delta > 0 ? '+' : '−'}${abs} pt vs précédent`;
}

export default function HbA1cListPage() {
  const measurements = useHbA1cMeasurements({ max: 30 });
  // measurements.data is descending (most-recent first). For each row, the
  // "previous" value for delta-computation is the next row in the sorted list.
  const data = measurements.data ?? [];

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="hba1c-list-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <FlaskConical className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Mes HbA1c</CardTitle>
          <CardDescription>
            Les 30 derniers résultats de laboratoire, les plus récents en premier.
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
            <Button asChild className="flex-1" data-testid="hba1c-new-cta">
              <Link to="/measurements/hba1c/new">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Nouvelle HbA1c
              </Link>
            </Button>
          </div>

          {measurements.isLoading && (
            <div
              className="text-muted-foreground flex items-center gap-2 text-sm"
              data-testid="hba1c-loading"
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
              data-testid="hba1c-list-error"
              className="text-destructive text-sm font-medium"
            >
              Impossible de charger tes HbA1c pour le moment.
              <Button
                onClick={() => measurements.refetch()}
                variant="link"
                className="ml-2 h-auto p-0"
              >
                Réessayer
              </Button>
            </p>
          )}

          {data.length === 0 && !measurements.isLoading && !measurements.isError && (
            <p data-testid="hba1c-empty" className="text-muted-foreground text-sm">
              Aucune HbA1c enregistrée pour l&apos;instant. Saisis le résultat de ton dernier bilan
              pour commencer à suivre l&apos;évolution.
            </p>
          )}

          {data.length > 0 && (
            <ul className="divide-border divide-y" data-testid="hba1c-list">
              {data.map((m, idx) => {
                const previous = data[idx + 1];
                const delta = previous ? Math.round((m.value - previous.value) * 10) / 10 : null;
                return (
                  <li key={m.id} className="py-3" data-testid={`hba1c-row-${m.id}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <span className="text-foreground text-lg font-semibold">
                          {formatValue(m.value)} %
                        </span>
                        {delta != null && (
                          <span
                            className="text-muted-foreground ml-2 text-xs"
                            data-testid={`hba1c-row-delta-${m.id}`}
                          >
                            {formatDelta(delta)}
                          </span>
                        )}
                      </div>
                      <time
                        dateTime={m.measuredAt}
                        className="text-muted-foreground text-xs"
                        data-testid={`hba1c-row-time-${m.id}`}
                      >
                        {dateFormatter.format(new Date(m.measuredAt))}
                      </time>
                    </div>
                    {(m.labName || m.note) && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {m.labName && <span className="font-medium">{m.labName}</span>}
                        {m.labName && m.note && ' · '}
                        {m.note}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
