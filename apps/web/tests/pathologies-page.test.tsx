import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import PathologiesPage from '@/pages/pathologies';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-profile', () => ({
  useUserDoc: () => ({
    data: { profile: null, pathologies: {}, pathologiesReviewedAt: null },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpsertPathologies: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

function renderPathologies() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/pathologies']}>
        <AuthProvider>
          <PathologiesPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<PathologiesPage />', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders all three pathology toggles', () => {
    renderPathologies();
    expect(screen.getByTestId('pathologies-card')).toBeInTheDocument();
    expect(screen.getByTestId('pathology-toggle-diabeteT2')).toBeVisible();
    expect(screen.getByTestId('pathology-toggle-hta')).toBeVisible();
    expect(screen.getByTestId('pathology-toggle-asthme')).toBeVisible();
  });

  it('submits an empty form when no pathology is checked', async () => {
    const user = userEvent.setup();
    renderPathologies();
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(mutateAsync).toHaveBeenCalledWith({});
  });

  it('reveals the diabetes profile picker when the toggle is checked', async () => {
    const user = userEvent.setup();
    renderPathologies();
    const toggle = screen.getByTestId('pathology-toggle-diabeteT2').querySelector('input')!;
    await user.click(toggle);
    expect(screen.getByTestId('diabete-profile-A')).toBeVisible();
    expect(screen.getByTestId('diabete-profile-E')).toBeVisible();
  });

  it('blocks submission if a checked pathology has no treatment profile picked', async () => {
    const user = userEvent.setup();
    renderPathologies();
    const toggle = screen.getByTestId('pathology-toggle-diabeteT2').querySelector('input')!;
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(await screen.findByText(/Choisis un profil de traitement/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits the chosen profile when valid', async () => {
    const user = userEvent.setup();
    renderPathologies();
    const toggle = screen.getByTestId('pathology-toggle-diabeteT2').querySelector('input')!;
    await user.click(toggle);
    const profileC = screen.getByTestId('diabete-profile-C').querySelector('input')!;
    await user.click(profileC);
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(mutateAsync).toHaveBeenCalledWith({
      diabeteT2: { treatmentProfile: 'C' },
    });
  });
});
