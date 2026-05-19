import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/login';
import { AuthProvider } from '@/hooks/use-auth';
import * as authLib from '@/lib/auth';

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof authLib>('@/lib/auth');
  return {
    ...actual,
    signInWithEmail: vi.fn(),
  };
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('<LoginPage />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors when email is missing or invalid', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    expect(await screen.findByText(/Adresse e-mail requise/i)).toBeVisible();
    expect(screen.getByText(/Mot de passe requis/i)).toBeVisible();
  });

  it('calls signInWithEmail with the submitted values', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/E-mail/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Mot de passe/i), 'super-secret');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));
    expect(authLib.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'super-secret');
  });
});
