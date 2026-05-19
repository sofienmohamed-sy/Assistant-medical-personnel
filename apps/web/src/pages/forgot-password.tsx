import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseError } from 'firebase/app';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/auth-schemas';
import { sendPasswordReset, translateAuthError } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmissionError(null);
    try {
      await sendPasswordReset(values.email);
      setSubmitted(true);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      // Note: pour des raisons de sécurité, on ne distingue pas un e-mail inconnu
      // d'un e-mail réellement envoyé côté UI.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setSubmitted(true);
        return;
      }
      setSubmissionError(translateAuthError(code));
    }
  }

  if (submitted) {
    return (
      <AuthShell
        title="Vérifie ta boîte e-mail"
        description="Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé."
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        <p className="text-muted-foreground text-sm" data-testid="forgot-success">
          Pense à regarder dans tes spams. Le lien expire après 1 heure.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Indique ton adresse e-mail, on t'envoie un lien pour le réinitialiser."
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          data-testid="forgot-form"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ton.adresse@exemple.fr"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {submissionError && (
            <p
              role="alert"
              data-testid="forgot-error"
              className="text-destructive text-sm font-medium"
            >
              {submissionError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
