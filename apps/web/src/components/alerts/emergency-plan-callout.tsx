import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { pickEmergencyPlanForReason } from '@shared/emergency-plan';
import type { DiabeteEmergencyPlanInput } from '@shared/emergency-plan';
import { cn } from '@/lib/utils';

interface EmergencyPlanCalloutProps {
  reasonCode: string;
  plan: DiabeteEmergencyPlanInput | null | undefined;
  className?: string;
  testId?: string;
}

/**
 * Render the user's personal plan d'urgence for a given alert reason. Returns
 * a short call-to-action that links to the editor when no relevant slice has
 * been filled in yet.
 */
export function EmergencyPlanCallout({
  reasonCode,
  plan,
  className,
  testId,
}: EmergencyPlanCalloutProps) {
  const slice = pickEmergencyPlanForReason(reasonCode, plan);

  if (!slice) {
    return (
      <div
        className={cn(
          'border-border bg-muted/30 flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-sm',
          className,
        )}
        data-testid={testId ?? 'emergency-plan-callout-empty'}
      >
        <ClipboardList
          className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">
          Pas encore de plan d&apos;urgence personnel pour cette situation.{' '}
          <Link to="/diabete/plan-urgence" className="text-primary font-medium hover:underline">
            Personnaliser maintenant
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-primary/40 bg-primary/5 rounded-md border px-3 py-2 text-sm',
        className,
      )}
      data-testid={testId ?? 'emergency-plan-callout'}
    >
      <h4 className="text-foreground mb-1 flex items-center gap-2 text-sm font-medium">
        <ClipboardList className="text-primary h-4 w-4" aria-hidden="true" />
        Ton plan d&apos;urgence
      </h4>
      <dl className="space-y-1">
        {slice.lines.map((line) => (
          <div
            key={line.label}
            className="flex flex-wrap gap-2"
            data-testid={`emergency-plan-line-${line.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <dt className="text-foreground font-medium">{line.label} :</dt>
            <dd className="text-muted-foreground">{line.value}</dd>
          </div>
        ))}
      </dl>
      <Link
        to="/diabete/plan-urgence"
        className="text-primary mt-2 inline-block text-xs hover:underline"
      >
        Modifier mon plan
      </Link>
    </div>
  );
}
