import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { signInSchema, type SignInValues } from '@/lib/auth-schemas';
import { signInWithEmail, translateAuthError } from '@/lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const redirectTo =
    (location.state as { from?: string } | null)?.from && location.state?.from !== '/login'
      ? location.state.from
      : '/app';

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: SignInValues) {
    setSubmissionError(null);
    try {
      await signInWithEmail(values.email, values.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      setSubmissionError(translateAuthError(code));
    }
  }

  return (
    <AuthShell
      title="Connexion"
      description="Connecte-toi à ton espace personnel."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Crée-en un
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          data-testid="login-form"
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
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de passe</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-muted-foreground text-xs hover:underline"
                  >
                    Oublié ?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
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
              data-testid="login-error"
              className="text-destructive text-sm font-medium"
            >
              {submissionError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
