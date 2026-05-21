import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, HeartPulse, Loader2, Stethoscope, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertBadge } from '@/components/alerts/alert-badge';
import { useAuth } from '@/hooks/use-auth';
import { useUserDoc } from '@/hooks/use-profile';
import { useGlycemiaMeasurements } from '@/hooks/use-measurements';
import { signOut } from '@/lib/auth';
import {
  ASTHME_PROFILE_LABELS_FR,
  computeGlycemiaAlert,
  computeGlycemiaTendance,
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

          {pathologies.diabeteT2 && (
            <GlycemiaQuickSection treatmentProfile={pathologies.diabeteT2.treatmentProfile} />
          )}

          <p>
            Les prochaines étapes (mesures HTA et asthme, mode médecin) seront ajoutées dans les PRs
            à venir.
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

interface GlycemiaQuickSectionProps {
  treatmentProfile: import('@shared/index').DiabeteT2Profile;
}

function GlycemiaQuickSection({ treatmentProfile }: GlycemiaQuickSectionProps) {
  // Pull the last 7 days' worth of measurements; capped tightly so the home
  // screen stays snappy. The list page itself fetches more for full history.
  const measurements = useGlycemiaMeasurements({ max: 14 });

  const tendance = measurements.data
    ? computeGlycemiaTendance({
        classified: measurements.data.map((m) => ({
          measuredAt: m.measuredAt,
          value: m.value,
          level: computeGlycemiaAlert({ value: m.value, moment: m.moment }, treatmentProfile).level,
        })),
      })
    : null;

  return (
    <section data-testid="glycemia-quick-section" className="space-y-2">
      <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
        <Droplet className="text-primary h-4 w-4" aria-hidden="true" />
        Suivi glycémie
      </h2>
      {tendance && tendance.totalLast7Days > 0 && (
        <div
          className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          data-testid="glycemia-quick-tendance"
        >
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{tendance.totalLast7Days}</span>{' '}
            {tendance.totalLast7Days > 1 ? 'mesures' : 'mesure'} cette semaine, dont{' '}
            <span className="text-foreground font-medium">{tendance.abnormalLast7Days}</span> hors
            cible
          </span>
          <AlertBadge level={tendance.maxLevelLast7Days} compact />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild className="flex-1" data-testid="glycemia-new-cta">
          <Link to="/measurements/glycemia/new">Saisir une glycémie</Link>
        </Button>
        <Button asChild variant="outline" data-testid="glycemia-history-cta">
          <Link to="/measurements/glycemia">Voir l’historique</Link>
        </Button>
      </div>
      <Button asChild variant="secondary" className="w-full" data-testid="symptoms-new-cta">
        <Link to="/symptoms/new">Reporter un symptôme</Link>
      </Button>
      <div className="flex flex-wrap gap-2" data-testid="hba1c-shortcut">
        <Button asChild variant="outline" className="flex-1" data-testid="hba1c-new-cta">
          <Link to="/measurements/hba1c/new">Saisir une HbA1c</Link>
        </Button>
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-xs"
          data-testid="hba1c-history-cta"
        >
          <Link to="/measurements/hba1c">Historique HbA1c →</Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-xs"
          data-testid="plan-urgence-cta"
        >
          <Link to="/diabete/plan-urgence">Mon plan d&apos;urgence personnalisé →</Link>
        </Button>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground h-auto p-0 text-xs"
          data-testid="equilibrium-cta"
        >
          <Link to="/diabete/equilibrium">Pourquoi maintenant&nbsp;? →</Link>
        </Button>
      </div>
    </section>
  );
}
