import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Loader2 } from 'lucide-react';
import {
  computeDiabeteSymptomTriage,
  DIABETE_SYMPTOM_CATEGORIES,
  DIABETE_SYMPTOM_CATEGORY_LABELS_FR,
  DIABETE_SYMPTOM_LABELS_FR,
  symptomsByCategory,
  type DiabeteSymptomCode,
  type DiabeteT2Profile,
  type SymptomTriageResult,
} from '@shared/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertBadge } from '@/components/alerts/alert-badge';
import { EmergencyPlanCallout } from '@/components/alerts/emergency-plan-callout';
import { cn } from '@/lib/utils';
import { useAddDiabeteSymptomReport } from '@/hooks/use-symptoms';
import { useDiabeteEmergencyPlan } from '@/hooks/use-emergency-plan';
import { useUserDoc } from '@/hooks/use-profile';

const symptomRowClass =
  'flex items-start gap-3 rounded-md border border-input px-3 py-2 hover:bg-accent/40 cursor-pointer';

const checkboxClass =
  'mt-1 h-4 w-4 shrink-0 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function SymptomsNewPage() {
  const navigate = useNavigate();
  const userDoc = useUserDoc();
  const addMutation = useAddDiabeteSymptomReport();
  const emergencyPlan = useDiabeteEmergencyPlan();
  const [selected, setSelected] = useState<Set<DiabeteSymptomCode>>(new Set());
  const [triage, setTriage] = useState<SymptomTriageResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const treatmentProfile: DiabeteT2Profile =
    userDoc.data?.pathologies.diabeteT2?.treatmentProfile ?? 'B';

  const grouped = useMemo(() => symptomsByCategory(), []);

  function toggle(code: DiabeteSymptomCode, next: boolean) {
    setSelected((current) => {
      const out = new Set(current);
      if (next) out.add(code);
      else out.delete(code);
      return out;
    });
    // If the user changes their selection after a triage was shown, the
    // triage card stays visible but the user can re-evaluate or save.
  }

  async function handleEvaluate() {
    setSubmissionError(null);
    if (selected.size === 0) {
      setTriage(null);
      setSubmissionError('Sélectionne au moins un symptôme.');
      return;
    }
    const result = computeDiabeteSymptomTriage(Array.from(selected), treatmentProfile);
    setTriage(result);
  }

  async function handleSave() {
    setSubmissionError(null);
    if (selected.size === 0) {
      setSubmissionError('Sélectionne au moins un symptôme.');
      return;
    }
    try {
      await addMutation.mutateAsync({
        pathologyType: 'diabeteT2',
        symptoms: Array.from(selected),
        reportedAt: new Date().toISOString(),
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer ce signalement pour le moment. Réessaie dans un instant.',
      );
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-start justify-center p-6">
      <Card className="w-full max-w-2xl" data-testid="symptoms-new-card">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Comment te sens-tu&nbsp;?</CardTitle>
          <CardDescription>
            Coche tous les signes que tu ressens en ce moment. L&apos;app propose une orientation
            basée sur la combinaison de signes et ton profil de traitement. Cette suggestion ne
            remplace pas un avis médical.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DIABETE_SYMPTOM_CATEGORIES.map((category) => (
            <section
              key={category}
              className="space-y-2"
              data-testid={`symptom-category-${category}`}
            >
              <h2 className="text-foreground text-sm font-semibold">
                {DIABETE_SYMPTOM_CATEGORY_LABELS_FR[category]}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {grouped[category].map((code) => (
                  <label key={code} className={cn(symptomRowClass)} data-testid={`symptom-${code}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(code)}
                      onChange={(e) => toggle(code, e.target.checked)}
                      className={checkboxClass}
                    />
                    <span className="text-foreground text-sm">
                      {DIABETE_SYMPTOM_LABELS_FR[code]}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}

          {submissionError && (
            <p
              role="alert"
              data-testid="symptoms-error"
              className="text-destructive text-sm font-medium"
            >
              {submissionError}
            </p>
          )}

          {triage && (
            <div
              data-testid="triage-result"
              className="border-border bg-muted/40 space-y-2 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-foreground text-sm font-semibold">Orientation</h3>
                <AlertBadge level={triage.level} compact />
              </div>
              <p className="text-foreground text-sm">
                <span className="font-medium">{triage.title}.</span>{' '}
                <span className="text-muted-foreground">{triage.message}</span>
              </p>
              <p className="text-muted-foreground text-sm">{triage.recommendation}</p>
              {triage.nextActions.length > 0 && (
                <ul
                  className="text-foreground list-disc space-y-1 pl-5 text-sm"
                  data-testid="triage-next-actions"
                >
                  {triage.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              )}
              {(triage.level === 'level2' ||
                triage.level === 'level3a' ||
                triage.level === 'level3b') && (
                <EmergencyPlanCallout
                  reasonCode={triage.reasonCode}
                  plan={emergencyPlan.data}
                  className="mt-2"
                  testId="triage-plan-callout"
                />
              )}
              <p className="text-muted-foreground text-xs">
                Sources&nbsp;: {triage.sources.join(' · ')}. Suggestion en attente de validation
                médicale.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/app">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Retour
              </Link>
            </Button>
            <Button
              variant={triage ? 'outline' : 'default'}
              onClick={handleEvaluate}
              disabled={selected.size === 0}
              className="flex-1"
              data-testid="triage-evaluate"
            >
              {triage ? 'Réévaluer' : 'Évaluer maintenant'}
            </Button>
            {triage && (
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={addMutation.isPending}
                data-testid="triage-save"
              >
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer ce signalement'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
