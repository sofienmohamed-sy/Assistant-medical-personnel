import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '@/pages/landing';
import { AuthProvider } from '@/hooks/use-auth';

function renderWithProviders(initialPath: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('<LandingPage />', () => {
  it('renders the landing card with the app name', () => {
    renderWithProviders();
    expect(screen.getByTestId('landing-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Assistant médical personnel/i })).toBeVisible();
  });

  it('shows Firebase status indicator', () => {
    renderWithProviders();
    expect(screen.getByTestId('firebase-status')).toBeInTheDocument();
  });

  it('links to /signup and /login', () => {
    renderWithProviders();
    expect(screen.getByRole('link', { name: /créer un compte/i })).toHaveAttribute(
      'href',
      '/signup',
    );
    expect(screen.getByRole('link', { name: /se connecter/i })).toHaveAttribute('href', '/login');
  });
});
