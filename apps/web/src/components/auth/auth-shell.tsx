import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm font-medium"
        >
          <HeartPulse className="text-primary h-5 w-5" aria-hidden="true" />
          Assistant médical personnel
        </Link>
        <Card data-testid="auth-card">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
        {footer && <div className="text-muted-foreground text-center text-sm">{footer}</div>}
      </div>
    </main>
  );
}
