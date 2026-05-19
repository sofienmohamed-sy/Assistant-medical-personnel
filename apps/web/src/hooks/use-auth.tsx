import * as React from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  isConfigured: boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = React.useState<AuthStatus>(
    isFirebaseConfigured ? 'loading' : 'signed-out',
  );
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setStatus(next ? 'signed-in' : 'signed-out');
    });
    return unsubscribe;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ status, user, isConfigured: isFirebaseConfigured }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
