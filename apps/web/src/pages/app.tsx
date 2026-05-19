import { useNavigate } from 'react-router-dom';
import { LogOut, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth';

export default function AppHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg" data-testid="app-home">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Bienvenue</CardTitle>
          <CardDescription>
            Connecté en tant que{' '}
            <span data-testid="user-email" className="text-foreground font-medium">
              {user?.email ?? '(adresse inconnue)'}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4 text-sm">
          <p>
            Ton espace est prêt. Les prochaines étapes (création du profil, ajout d&apos;une
            pathologie, début du suivi quotidien) seront ajoutées dans les PRs à venir.
          </p>
          <Button
            variant="outline"
            onClick={handleSignOut}
            data-testid="sign-out-button"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
