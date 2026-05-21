import { AlertCircle, AlertTriangle, Info, ShieldCheck, Siren } from 'lucide-react';
import type { AlertLevel } from '@shared/alerts';
import { ALERT_LEVEL_LABELS_FR } from '@shared/alerts';
import { cn } from '@/lib/utils';

const styles: Record<AlertLevel, string> = {
  normal:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100',
  level1:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100',
  level2:
    'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-100',
  level3a:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100',
  level3b:
    'border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-50',
};

const icons: Record<
  AlertLevel,
  React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
> = {
  normal: ShieldCheck,
  level1: Info,
  level2: AlertCircle,
  level3a: AlertTriangle,
  level3b: Siren,
};

interface AlertBadgeProps {
  level: AlertLevel;
  className?: string;
  /** When set, render a compact pill suitable for a list row. */
  compact?: boolean;
}

export function AlertBadge({ level, className, compact = false }: AlertBadgeProps) {
  const Icon = icons[level];
  return (
    <span
      data-testid={`alert-badge-${level}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        styles[level],
        className,
      )}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden />
      {ALERT_LEVEL_LABELS_FR[level]}
    </span>
  );
}
