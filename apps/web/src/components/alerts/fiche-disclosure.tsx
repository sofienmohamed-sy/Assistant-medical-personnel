import { BookOpen, ChevronRight } from 'lucide-react';
import type { Fiche } from '@shared/fiches';
import { cn } from '@/lib/utils';

interface FicheDisclosureProps {
  fiche: Fiche;
  className?: string;
  /** Test id stem; sections get `${testId}-section-${i}`. */
  testId?: string;
}

/**
 * Collapsible "En savoir plus" card per design doc §2.7. Built on the native
 * <details> element so it works without JS (PWA offline-friendly) and ships
 * the right ARIA semantics for free.
 */
export function FicheDisclosure({
  fiche,
  className,
  testId = 'fiche-disclosure',
}: FicheDisclosureProps) {
  return (
    <details
      data-testid={testId}
      className={cn(
        'border-border bg-muted/30 group rounded-md border text-sm',
        'open:bg-muted/50',
        className,
      )}
    >
      <summary
        className={cn(
          'text-foreground flex cursor-pointer items-center gap-2 px-3 py-2 font-medium',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
          // Hide the default disclosure triangle so we can use our own chevron.
          'list-none [&::-webkit-details-marker]:hidden',
        )}
      >
        <BookOpen className="text-primary h-4 w-4" aria-hidden="true" />
        <span>En savoir plus</span>
        <span className="text-muted-foreground ml-auto text-xs italic">{fiche.tagline}</span>
        <ChevronRight
          className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
      </summary>
      <div className="border-border space-y-3 border-t px-3 py-3">
        <h3 className="text-foreground text-base font-semibold">{fiche.title}</h3>
        {fiche.sections.map((section, i) => (
          <details
            key={section.question}
            className="border-border bg-background rounded border"
            data-testid={`${testId}-section-${i}`}
          >
            <summary
              className={cn(
                'text-foreground flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                'list-none [&::-webkit-details-marker]:hidden',
              )}
            >
              <ChevronRight
                className="text-muted-foreground h-3.5 w-3.5 transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
              {section.question}
            </summary>
            <div className="border-border text-muted-foreground border-t px-3 py-2 text-sm">
              {section.body.split('\n\n').map((para, j) => (
                <p key={j} className="mb-2 whitespace-pre-line last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </details>
        ))}
        <div className="text-muted-foreground text-xs">
          <p className="text-foreground mb-1 font-medium">Sources</p>
          <ul className="list-inside list-disc space-y-0.5">
            {fiche.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground text-xs italic">
          Contenu compilé depuis les sources publiques officielles, en attente de validation
          médicale finale.
        </p>
      </div>
    </details>
  );
}
