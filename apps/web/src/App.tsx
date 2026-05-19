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
import { isFirebaseConfigured } from '@/lib/firebase';

export default function App() {
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
            Cette installation est un squelette technique. Les fonctionnalités produit
            (authentification, profils, suivi des pathologies) seront ajoutées dans des PRs
            ultérieures.
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
          <Button variant="default">En savoir plus</Button>
          <Button variant="outline">Voir la documentation</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
