import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeartPulse, Loader2 } from 'lucide-react';
import {
  COUNTRY_CODES,
  COUNTRY_LABELS_FR,
  patientProfileSchema,
  type PatientProfileInput,
} from '@shared/profile';
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
import { useUpsertProfile } from '@/hooks/use-profile';

const selectClassName = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
);

export default function OnboardingPage() {
  const navigate = useNavigate();
  const upsert = useUpsertProfile();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<PatientProfileInput>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      dateOfBirth: '',
      countryOfResidence: 'FR',
      countryOfOrigin: 'FR',
      profession: '',
    },
  });

  async function onSubmit(values: PatientProfileInput) {
    setSubmissionError(null);
    try {
      await upsert.mutateAsync(values);
      navigate('/pathologies', { replace: true });
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer ton profil pour le moment. Réessaie dans un instant.',
      );
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-xl" data-testid="onboarding-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Crée ton profil</CardTitle>
          <CardDescription>
            On a besoin de quelques informations pour personnaliser ton suivi. Tu pourras tout
            modifier plus tard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
              data-testid="onboarding-form"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input autoComplete="given-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input autoComplete="family-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" autoComplete="bday" {...field} />
                    </FormControl>
                    <FormDescription>Au format AAAA-MM-JJ.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="countryOfResidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays de résidence</FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          autoComplete="country"
                          {...field}
                          aria-label="Pays de résidence"
                        >
                          {COUNTRY_CODES.map((code) => (
                            <option key={code} value={code}>
                              {COUNTRY_LABELS_FR[code]}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays d’origine</FormLabel>
                      <FormControl>
                        <select className={selectClassName} {...field} aria-label="Pays d’origine">
                          {COUNTRY_CODES.map((code) => (
                            <option key={code} value={code}>
                              {COUNTRY_LABELS_FR[code]}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex. enseignant, retraité, infirmier·ère…"
                        autoComplete="organization-title"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Utilisé pour adapter les recommandations à ton mode de vie. Jamais partagé.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submissionError && (
                <p
                  role="alert"
                  data-testid="onboarding-error"
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
