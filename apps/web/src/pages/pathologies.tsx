import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeartPulse, Loader2 } from 'lucide-react';
import {
  ASTHME_PROFILE_LABELS_FR,
  ASTHME_PROFILES,
  DIABETE_T2_PROFILE_LABELS_FR,
  DIABETE_T2_PROFILES,
  HTA_PROFILE_LABELS_FR,
  HTA_PROFILES,
  PATHOLOGY_DESCRIPTIONS_FR,
  PATHOLOGY_LABELS_FR,
  type AsthmeProfile,
  type DiabeteT2Profile,
  type HtaProfile,
  type PathologiesFormInput,
  pathologiesFormSchema,
} from '@shared/pathologies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useUpsertPathologies, useUserDoc } from '@/hooks/use-profile';

const radioRowClass =
  'flex items-start gap-3 rounded-md border border-input px-3 py-2 hover:bg-accent/40 cursor-pointer';

const checkboxClass =
  'mt-1 h-4 w-4 shrink-0 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const radioInputClass =
  'mt-1 h-4 w-4 shrink-0 border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

type PathologyKey = 'diabeteT2' | 'hta' | 'asthme';

interface SectionProps {
  pathologyKey: PathologyKey;
  isActive: boolean;
  onToggle: (next: boolean) => void;
  children?: React.ReactNode;
}

function PathologySection({ pathologyKey, isActive, onToggle, children }: SectionProps) {
  return (
    <div className="border-border rounded-lg border p-4">
      <label
        className="flex cursor-pointer items-start gap-3"
        data-testid={`pathology-toggle-${pathologyKey}`}
      >
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onToggle(e.target.checked)}
          className={checkboxClass}
          aria-label={`Activer ${PATHOLOGY_LABELS_FR[pathologyKey]}`}
        />
        <div className="space-y-1">
          <div className="text-foreground font-medium">{PATHOLOGY_LABELS_FR[pathologyKey]}</div>
          <p className="text-muted-foreground text-sm">{PATHOLOGY_DESCRIPTIONS_FR[pathologyKey]}</p>
        </div>
      </label>
      {isActive && <div className="mt-4 space-y-2 pl-7">{children}</div>}
    </div>
  );
}

export default function PathologiesPage() {
  const navigate = useNavigate();
  const userDoc = useUserDoc();
  const upsert = useUpsertPathologies();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<PathologiesFormInput>({
    resolver: zodResolver(pathologiesFormSchema),
    defaultValues: {
      diabeteT2: userDoc.data?.pathologies.diabeteT2
        ? { treatmentProfile: userDoc.data.pathologies.diabeteT2.treatmentProfile }
        : undefined,
      hta: userDoc.data?.pathologies.hta
        ? { treatmentProfile: userDoc.data.pathologies.hta.treatmentProfile }
        : undefined,
      asthme: userDoc.data?.pathologies.asthme
        ? { treatmentProfile: userDoc.data.pathologies.asthme.treatmentProfile }
        : undefined,
    },
  });

  const diabeteValue = useWatch({ control: form.control, name: 'diabeteT2' });
  const htaValue = useWatch({ control: form.control, name: 'hta' });
  const asthmeValue = useWatch({ control: form.control, name: 'asthme' });

  function toggle(key: PathologyKey, next: boolean) {
    if (next) {
      form.setValue(key, { treatmentProfile: undefined as never }, { shouldValidate: false });
    } else {
      form.setValue(key, undefined, { shouldValidate: false });
      form.clearErrors(key);
    }
  }

  async function onSubmit(values: PathologiesFormInput) {
    setSubmissionError(null);
    try {
      await upsert.mutateAsync(values);
      navigate('/app', { replace: true });
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer tes pathologies pour le moment. Réessaie dans un instant.',
      );
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="pathologies-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Tes pathologies suivies</CardTitle>
          <CardDescription>
            Sélectionne celles qui te concernent et indique le traitement actuel. Tu peux revenir
            modifier cette page à tout moment. Aucune sélection si tu n’as pas de pathologie
            chronique aujourd’hui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
              data-testid="pathologies-form"
            >
              <PathologySection
                pathologyKey="diabeteT2"
                isActive={Boolean(diabeteValue)}
                onToggle={(next) => toggle('diabeteT2', next)}
              >
                <FormField
                  control={form.control}
                  name="diabeteT2.treatmentProfile"
                  render={({ field }) => (
                    <FormItem>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">Profil de traitement</legend>
                        {DIABETE_T2_PROFILES.map((profile) => (
                          <label
                            key={profile}
                            className={cn(radioRowClass)}
                            data-testid={`diabete-profile-${profile}`}
                          >
                            <FormControl>
                              <input
                                type="radio"
                                value={profile}
                                checked={(field.value as DiabeteT2Profile | undefined) === profile}
                                onChange={() => field.onChange(profile)}
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                className={radioInputClass}
                              />
                            </FormControl>
                            <div className="text-sm">
                              <span className="font-medium">Profil {profile}</span> ·{' '}
                              {DIABETE_T2_PROFILE_LABELS_FR[profile]}
                            </div>
                          </label>
                        ))}
                      </fieldset>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PathologySection>

              <PathologySection
                pathologyKey="hta"
                isActive={Boolean(htaValue)}
                onToggle={(next) => toggle('hta', next)}
              >
                <FormField
                  control={form.control}
                  name="hta.treatmentProfile"
                  render={({ field }) => (
                    <FormItem>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">Niveau de traitement</legend>
                        {HTA_PROFILES.map((profile) => (
                          <label
                            key={profile}
                            className={cn(radioRowClass)}
                            data-testid={`hta-profile-${profile}`}
                          >
                            <FormControl>
                              <input
                                type="radio"
                                value={profile}
                                checked={(field.value as HtaProfile | undefined) === profile}
                                onChange={() => field.onChange(profile)}
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                className={radioInputClass}
                              />
                            </FormControl>
                            <div className="text-sm">{HTA_PROFILE_LABELS_FR[profile]}</div>
                          </label>
                        ))}
                      </fieldset>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PathologySection>

              <PathologySection
                pathologyKey="asthme"
                isActive={Boolean(asthmeValue)}
                onToggle={(next) => toggle('asthme', next)}
              >
                <FormField
                  control={form.control}
                  name="asthme.treatmentProfile"
                  render={({ field }) => (
                    <FormItem>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">Palier GINA</legend>
                        {ASTHME_PROFILES.map((profile) => (
                          <label
                            key={profile}
                            className={cn(radioRowClass)}
                            data-testid={`asthme-profile-${profile}`}
                          >
                            <FormControl>
                              <input
                                type="radio"
                                value={profile}
                                checked={(field.value as AsthmeProfile | undefined) === profile}
                                onChange={() => field.onChange(profile)}
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                className={radioInputClass}
                              />
                            </FormControl>
                            <div className="text-sm">{ASTHME_PROFILE_LABELS_FR[profile]}</div>
                          </label>
                        ))}
                      </fieldset>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PathologySection>

              {submissionError && (
                <p
                  role="alert"
                  data-testid="pathologies-error"
                  className="text-destructive text-sm font-medium"
                >
                  {submissionError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || upsert.isPending}
              >
                {form.formState.isSubmitting || upsert.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enregistrement…
                  </>
                ) : (
                  'Continuer'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
