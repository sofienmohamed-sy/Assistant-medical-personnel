import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseError } from 'firebase/app';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
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
import { signUpSchema, type SignUpValues } from '@/lib/auth-schemas';
import { signUpWithEmail, translateAuthError } from '@/lib/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: SignUpValues) {
    setSubmissionError(null);
    try {
      await signUpWithEmail(values.email, values.password);
      navigate('/app', { replace: true });
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      setSubmissionError(translateAuthError(code));
    }
  }

  return (
    <AuthShell
      title="Créer un compte"
      description="Quelques secondes pour commencer ton suivi."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Connecte-toi
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          data-testid="signup-form"
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Au moins 8 caractères.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
              data-testid="signup-error"
              className="text-destructive text-sm font-medium"
            >
              {submissionError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
