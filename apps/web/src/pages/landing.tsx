import { Link, Navigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function LandingPage() {
  const { status } = useAuth();

  if (status === 'signed-in') {
    return <Navigate to="/app" replace />;
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg" data-testid="landing-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Assistant médical personnel</CardTitle>
          <CardDescription>
            Application d&apos;accompagnement santé au quotidien pour vous et votre famille.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Crée un compte ou connecte-toi pour commencer ton suivi. Les fonctionnalités produit
            (profil, suivi des pathologies, mode famille) seront ajoutées dans des PRs ultérieures.
          </p>
          <p>
            État de la configuration Firebase :{' '}
            <span
              data-testid="firebase-status"
              className={
                isFirebaseConfigured ? 'text-primary font-medium' : 'text-destructive font-medium'
              }
            >
              {isFirebaseConfigured ? 'connectée' : 'non configurée'}
            </span>
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild variant="default" className="flex-1">
            <Link to="/signup">Créer un compte</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/login">Se connecter</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
