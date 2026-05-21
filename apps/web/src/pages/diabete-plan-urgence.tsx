import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ClipboardList, Loader2, Phone, Siren } from 'lucide-react';
import {
  DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS,
  diabeteEmergencyPlanSchema,
  type DiabeteEmergencyPlanInput,
} from '@shared/emergency-plan';
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
import { useDiabeteEmergencyPlan, useUpsertDiabeteEmergencyPlan } from '@/hooks/use-emergency-plan';

const sectionClass = 'rounded-lg border border-border p-4 space-y-3';
const sectionTitleClass = 'flex items-center gap-2 text-sm font-semibold text-foreground';

const emptyValues: DiabeteEmergencyPlanInput = {
  hypoSugarSource: '',
  hypoQuickContact: '',
  hypoNotes: '',
  hyperRecheckMinutes: undefined,
  hyperMedicalContact: '',
  hyperNotes: '',
  ketoEmergencyNumber: '',
  ketoNearestEmergencyRoom: '',
  ketoNotes: '',
};

export default function DiabetePlanUrgencePage() {
  const navigate = useNavigate();
  const planQuery = useDiabeteEmergencyPlan();
  const upsert = useUpsertDiabeteEmergencyPlan();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<DiabeteEmergencyPlanInput>({
    resolver: zodResolver(diabeteEmergencyPlanSchema),
    defaultValues: emptyValues,
  });

  // Populate the form when the existing plan loads.
  useEffect(() => {
    if (planQuery.data) {
      form.reset({
        hypoSugarSource: planQuery.data.hypoSugarSource ?? '',
        hypoQuickContact: planQuery.data.hypoQuickContact ?? '',
        hypoNotes: planQuery.data.hypoNotes ?? '',
        hyperRecheckMinutes: planQuery.data.hyperRecheckMinutes,
        hyperMedicalContact: planQuery.data.hyperMedicalContact ?? '',
        hyperNotes: planQuery.data.hyperNotes ?? '',
        ketoEmergencyNumber: planQuery.data.ketoEmergencyNumber ?? '',
        ketoNearestEmergencyRoom: planQuery.data.ketoNearestEmergencyRoom ?? '',
        ketoNotes: planQuery.data.ketoNotes ?? '',
      });
    }
    // form is stable for the lifetime of the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planQuery.data]);

  async function onSubmit(values: DiabeteEmergencyPlanInput) {
    setSubmissionError(null);
    try {
      await upsert.mutateAsync(values);
      navigate('/app', { replace: true });
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer ton plan d’urgence pour le moment. Réessaie dans un instant.',
      );
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="plan-urgence-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <ClipboardList className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Mon plan d&apos;urgence — Diabète</CardTitle>
          <CardDescription>
            Ces informations apparaîtront sous les alertes de glycémie critiques. Tout est
            facultatif&nbsp;: tu peux ne renseigner que ce qui te semble utile. Les valeurs par
            défaut suggérées suivent le modèle HAS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planQuery.isLoading && (
            <div
              className="text-muted-foreground mb-4 flex items-center gap-2 text-sm"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement de ton plan…
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
              data-testid="plan-urgence-form"
            >
              <section className={sectionClass} data-testid="section-hypoglycemia">
                <h2 className={sectionTitleClass}>
                  <Phone className="text-primary h-4 w-4" aria-hidden="true" />
                  Hypoglycémie (&lt; 0,70 g/L ou symptômes)
                </h2>
                <FormField
                  control={form.control}
                  name="hypoSugarSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resucrage rapide</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS.hypoSugarSource}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Où trouver 15 g de sucre rapide chez toi et au travail.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hypoQuickContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact rapide</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS.hypoQuickContact}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Quelqu&apos;un à appeler en cas de malaise — prénom + numéro.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hypoNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autres consignes (facultatif)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex. glucagon dans le tiroir du haut"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className={sectionClass} data-testid="section-hyperglycemia">
                <h2 className={sectionTitleClass}>
                  <Phone className="text-primary h-4 w-4" aria-hidden="true" />
                  Hyperglycémie élevée (&gt; 2,5 g/L à jeun ou &gt; 3 g/L post-repas)
                </h2>
                <FormField
                  control={form.control}
                  name="hyperRecheckMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Délai de recontrôle (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={5}
                          max={120}
                          step={5}
                          placeholder={String(
                            DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS.hyperRecheckMinutes,
                          )}
                          value={
                            typeof field.value === 'number' && Number.isFinite(field.value)
                              ? field.value
                              : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            field.onChange(raw === '' ? undefined : Number(raw));
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Combien de temps attendre avant de mesurer à nouveau.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hyperMedicalContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact médical</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS.hyperMedicalContact}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>Médecin traitant, diabétologue, infirmière…</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hyperNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autres consignes (facultatif)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex. boire 50 cl d'eau, vérifier les corps cétoniques"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className={sectionClass} data-testid="section-acidocetose">
                <h2 className={sectionTitleClass}>
                  <Siren className="text-destructive h-4 w-4" aria-hidden="true" />
                  Urgence vitale (&gt; 3,5 g/L avec symptômes, ou troubles de conscience)
                </h2>
                <FormField
                  control={form.control}
                  name="ketoEmergencyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro d&apos;urgence</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="tel"
                          placeholder={DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS.ketoEmergencyNumber}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Par défaut, le 15. Tu peux mettre un autre numéro si plus pertinent.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ketoNearestEmergencyRoom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service d&apos;urgence le plus proche</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={DIABETE_EMERGENCY_PLAN_HAS_DEFAULTS.ketoNearestEmergencyRoom}
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
                  name="ketoNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autres consignes (facultatif)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex. ordonnance d'urgence dans le portefeuille"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {submissionError && (
                <p
                  role="alert"
                  data-testid="plan-urgence-error"
                  className="text-destructive text-sm font-medium"
                >
                  {submissionError}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/app">
                    <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                    Annuler
                  </Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting || upsert.isPending}
                >
                  {form.formState.isSubmitting || upsert.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer mon plan'
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
