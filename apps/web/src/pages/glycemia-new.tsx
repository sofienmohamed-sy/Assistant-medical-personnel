import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Droplet, Loader2, ArrowLeft } from 'lucide-react';
import {
  GLYCEMIA_MAX,
  GLYCEMIA_MIN,
  GLYCEMIA_MOMENT_LABELS_FR,
  GLYCEMIA_MOMENTS,
  glycemiaMeasurementSchema,
  type GlycemiaMeasurementInput,
  type GlycemiaMoment,
} from '@shared/measurements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAddGlycemiaMeasurement } from '@/hooks/use-measurements';

const radioRowClass =
  'flex items-start gap-3 rounded-md border border-input px-3 py-2 hover:bg-accent/40 cursor-pointer';

const radioInputClass =
  'mt-1 h-4 w-4 shrink-0 border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function localDatetimeInputValue(d: Date): string {
  // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GlycemiaNewPage() {
  const navigate = useNavigate();
  const addMutation = useAddGlycemiaMeasurement();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const nowLocal = useMemo(() => localDatetimeInputValue(new Date()), []);

  const form = useForm<GlycemiaMeasurementInput>({
    resolver: zodResolver(glycemiaMeasurementSchema),
    defaultValues: {
      pathologyType: 'diabeteT2',
      measurementType: 'glycemia',
      unit: 'g/L',
      value: Number.NaN,
      moment: undefined as unknown as GlycemiaMoment,
      measuredAt: new Date().toISOString(),
      note: '',
    },
  });

  async function onSubmit(values: GlycemiaMeasurementInput) {
    setSubmissionError(null);
    try {
      await addMutation.mutateAsync(values);
      navigate('/measurements/glycemia', { replace: true });
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer la mesure pour le moment. Réessaie dans un instant.',
      );
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-xl" data-testid="glycemia-new-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Droplet className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Nouvelle mesure de glycémie</CardTitle>
          <CardDescription>
            Note ta glycémie en g/L et indique dans quel contexte tu l’as mesurée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
              data-testid="glycemia-form"
            >
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glycémie (g/L)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={GLYCEMIA_MIN}
                        max={GLYCEMIA_MAX}
                        placeholder="ex. 1,25"
                        value={Number.isFinite(field.value) ? field.value : ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            field.onChange(Number.NaN);
                            return;
                          }
                          // Accept comma as decimal separator too (French keyboards).
                          const parsed = Number(raw.replace(',', '.'));
                          field.onChange(parsed);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Cible usuelle&nbsp;: à jeun &lt; 1,10 g/L · 2 h après repas &lt; 1,40 g/L
                      (HAS).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moment"
                render={({ field }) => (
                  <FormItem>
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">Contexte</legend>
                      {GLYCEMIA_MOMENTS.map((moment) => (
                        <label
                          key={moment}
                          className={cn(radioRowClass)}
                          data-testid={`glycemia-moment-${moment}`}
                        >
                          <FormControl>
                            <input
                              type="radio"
                              value={moment}
                              checked={field.value === moment}
                              onChange={() => field.onChange(moment)}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              className={radioInputClass}
                            />
                          </FormControl>
                          <div className="text-sm">{GLYCEMIA_MOMENT_LABELS_FR[moment]}</div>
                        </label>
                      ))}
                    </fieldset>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measuredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date et heure de la mesure</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value ? localDatetimeInputValue(new Date(field.value)) : nowLocal
                        }
                        max={nowLocal}
                        onChange={(e) => {
                          if (!e.target.value) {
                            field.onChange('');
                            return;
                          }
                          field.onChange(new Date(e.target.value).toISOString());
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>Par défaut, maintenant.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (facultatif)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex. après une activité physique, repas plus riche que d'habitude…"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submissionError && (
                <p
                  role="alert"
                  data-testid="glycemia-error"
                  className="text-destructive text-sm font-medium"
                >
                  {submissionError}
                </p>
              )}

              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/measurements/glycemia">
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    Annuler
                  </Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting || addMutation.isPending}
                >
                  {form.formState.isSubmitting || addMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
