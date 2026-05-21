import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FlaskConical, Loader2 } from 'lucide-react';
import {
  HBA1C_MAX,
  HBA1C_MIN,
  hba1cMeasurementSchema,
  type HbA1cMeasurementInput,
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
import { useAddHbA1cMeasurement } from '@/hooks/use-hba1c';

function localDatetimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HbA1cNewPage() {
  const navigate = useNavigate();
  const addMutation = useAddHbA1cMeasurement();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const nowLocal = useMemo(() => localDatetimeInputValue(new Date()), []);

  const form = useForm<HbA1cMeasurementInput>({
    resolver: zodResolver(hba1cMeasurementSchema),
    defaultValues: {
      pathologyType: 'diabeteT2',
      measurementType: 'hba1c',
      unit: '%',
      value: Number.NaN,
      measuredAt: new Date().toISOString(),
      labName: '',
      note: '',
    },
  });

  async function onSubmit(values: HbA1cMeasurementInput) {
    setSubmissionError(null);
    try {
      await addMutation.mutateAsync(values);
      navigate('/measurements/hba1c', { replace: true });
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer cette HbA1c pour le moment. Réessaie dans un instant.',
      );
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-xl" data-testid="hba1c-new-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <FlaskConical className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Nouvelle HbA1c</CardTitle>
          <CardDescription>
            Saisis ici la valeur lue sur ton résultat de laboratoire (en %). C&apos;est ton médecin
            qui définit ta cible personnelle&nbsp;: nous nous contentons d&apos;enregistrer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
              data-testid="hba1c-form"
            >
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HbA1c (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min={HBA1C_MIN}
                        max={HBA1C_MAX}
                        placeholder="ex. 6,8"
                        value={Number.isFinite(field.value) ? field.value : ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            field.onChange(Number.NaN);
                            return;
                          }
                          field.onChange(Number(raw.replace(',', '.')));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Repère utile&nbsp;: la HbA1c d&apos;une personne non diabétique est &lt; 5,7 %
                      (HAS). Ta cible personnelle est définie avec ton médecin selon ton profil.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measuredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date du prélèvement</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Laboratoire (facultatif)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex. Biogroup, Cerballiance…"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
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
                        placeholder="ex. bilan trimestriel demandé par Dr. Dupont"
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
                  data-testid="hba1c-error"
                  className="text-destructive text-sm font-medium"
                >
                  {submissionError}
                </p>
              )}

              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/measurements/hba1c">
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
