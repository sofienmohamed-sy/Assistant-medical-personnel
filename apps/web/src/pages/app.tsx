import { Navigate, useNavigate } from 'react-router-dom';
import { LogOut, HeartPulse, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { signOut } from '@/lib/auth';
import { COUNTRY_LABELS_FR } from '@shared/profile';

export default function AppHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfile();

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  if (profile.isLoading) {
    return (
      <div
        className="bg-background text-muted-foreground flex min-h-svh items-center justify-center"
        data-testid="profile-loading"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Chargement de ton profil…
      </div>
    );
  }

  if (profile.isError) {
    return (
      <main className="bg-background flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-md" data-testid="profile-error">
          <CardHeader>
            <CardTitle>Impossible de charger ton profil</CardTitle>
            <CardDescription>
              Une erreur est survenue. Réessaie dans quelques instants ou déconnecte-toi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => profile.refetch()} className="w-full">
              Réessayer
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!profile.data) {
    return <Navigate to="/onboarding" replace />;
  }

  const { prenom, nom, countryOfResidence } = profile.data;

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg" data-testid="app-home">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <HeartPulse className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>
            Bienvenue, <span data-testid="profile-name">{prenom}</span>
          </CardTitle>
          <CardDescription>
            Connecté en tant que{' '}
            <span data-testid="user-email" className="text-foreground font-medium">
              {user?.email ?? '(adresse inconnue)'}
            </span>
            {' · '}
            {nom} · {COUNTRY_LABELS_FR[countryOfResidence]}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4 text-sm">
          <p>
            Ton espace est prêt. Les prochaines étapes (ajout d&apos;une pathologie, début du suivi
            quotidien) seront ajoutées dans les PRs à venir.
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
