import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, HeartPulse, Loader2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useUserDoc } from '@/hooks/use-profile';
import { signOut } from '@/lib/auth';
import {
  ASTHME_PROFILE_LABELS_FR,
  COUNTRY_LABELS_FR,
  DIABETE_T2_PROFILE_LABELS_FR,
  HTA_PROFILE_LABELS_FR,
} from '@shared/index';

export default function AppHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userDoc = useUserDoc();

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  if (userDoc.isLoading) {
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

  if (userDoc.isError) {
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
            <Button onClick={() => userDoc.refetch()} className="w-full">
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

  if (!userDoc.data?.profile) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!userDoc.data.pathologiesReviewedAt) {
    return <Navigate to="/pathologies" replace />;
  }

  const { profile, pathologies } = userDoc.data;
  const { prenom, nom, countryOfResidence } = profile;

  const activePathologies: Array<{ key: string; label: string; detail: string }> = [];
  if (pathologies.diabeteT2) {
    activePathologies.push({
      key: 'diabeteT2',
      label: 'Diabète de type 2',
      detail: `Profil ${pathologies.diabeteT2.treatmentProfile} — ${DIABETE_T2_PROFILE_LABELS_FR[pathologies.diabeteT2.treatmentProfile]}`,
    });
  }
  if (pathologies.hta) {
    activePathologies.push({
      key: 'hta',
      label: 'Hypertension artérielle',
      detail: HTA_PROFILE_LABELS_FR[pathologies.hta.treatmentProfile],
    });
  }
  if (pathologies.asthme) {
    activePathologies.push({
      key: 'asthme',
      label: 'Asthme',
      detail: ASTHME_PROFILE_LABELS_FR[pathologies.asthme.treatmentProfile],
    });
  }

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
          <section data-testid="active-pathologies-section">
            <h2 className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <Stethoscope className="text-primary h-4 w-4" aria-hidden="true" />
              Tes pathologies suivies
            </h2>
            {activePathologies.length === 0 ? (
              <p data-testid="no-pathologies">
                Aucune pathologie chronique active. L&apos;app se fera discrète et veillera quand
                même sur les signaux importants.
              </p>
            ) : (
              <ul className="space-y-1" data-testid="active-pathologies-list">
                {activePathologies.map((p) => (
                  <li key={p.key} data-testid={`pathology-${p.key}`}>
                    <span className="text-foreground font-medium">{p.label}</span> — {p.detail}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <Link to="/pathologies">Modifier mes pathologies</Link>
            </Button>
          </section>

          <p>
            Ton espace est prêt. Les prochaines étapes (saisie quotidienne, alertes, mode médecin)
            seront ajoutées dans les PRs à venir.
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
