import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import OnboardingPage from '@/pages/onboarding';

const mutateAsync = vi.fn().mockResolvedValue(undefined);
const isPending = false;

vi.mock('@/hooks/use-profile', () => ({
  useUpsertProfile: () => ({
    mutateAsync,
    isPending,
    isError: false,
    error: null,
  }),
  useProfile: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function renderOnboarding() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <AuthProvider>
          <OnboardingPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<OnboardingPage />', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders the form with all expected fields', () => {
    renderOnboarding();
    expect(screen.getByTestId('onboarding-card')).toBeInTheDocument();
    expect(screen.getByLabelText(/Prénom/)).toBeVisible();
    expect(screen.getByLabelText(/^Nom$/)).toBeVisible();
    expect(screen.getByLabelText(/Date de naissance/)).toBeVisible();
    expect(screen.getByLabelText(/Pays de résidence/)).toBeVisible();
    expect(screen.getByLabelText(/Pays d.origine/)).toBeVisible();
    expect(screen.getByLabelText(/Profession/)).toBeVisible();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(await screen.findByText(/Prénom requis/i)).toBeVisible();
    expect(screen.getByText(/^Nom requis/i)).toBeVisible();
    expect(screen.getByText(/Profession requise/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits the profile when all fields are valid', async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.type(screen.getByLabelText(/Prénom/), 'Sofien');
    await user.type(screen.getByLabelText(/^Nom$/), 'Mohamed');
    await user.type(screen.getByLabelText(/Date de naissance/), '1990-05-12');
    await user.type(screen.getByLabelText(/Profession/), 'développeur');
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        prenom: 'Sofien',
        nom: 'Mohamed',
        dateOfBirth: '1990-05-12',
        profession: 'développeur',
        countryOfResidence: 'FR',
        countryOfOrigin: 'FR',
      }),
    );
  });
});
