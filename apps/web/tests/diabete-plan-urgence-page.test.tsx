import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import DiabetePlanUrgencePage from '@/pages/diabete-plan-urgence';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-emergency-plan', () => ({
  useDiabeteEmergencyPlan: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpsertDiabeteEmergencyPlan: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/diabete/plan-urgence']}>
        <AuthProvider>
          <DiabetePlanUrgencePage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<DiabetePlanUrgencePage />', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders the three scenario sections', () => {
    renderPage();
    expect(screen.getByTestId('section-hypoglycemia')).toBeVisible();
    expect(screen.getByTestId('section-hyperglycemia')).toBeVisible();
    expect(screen.getByTestId('section-acidocetose')).toBeVisible();
  });

  it('submits an empty plan when nothing is filled in', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /enregistrer mon plan/i }));
    expect(mutateAsync).toHaveBeenCalledWith(expect.any(Object));
    const payload = mutateAsync.mock.calls[0]![0] as Record<string, unknown>;
    // All values are either empty strings or undefined — exercises the
    // "user submitted nothing" path. The lib drops blanks before writing.
    for (const v of Object.values(payload)) {
      expect(v === undefined || v === '' || v === null).toBe(true);
    }
  });

  it('submits the filled values', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/resucrage rapide/i), '3 morceaux de sucre');
    await user.type(screen.getByLabelText(/délai de recontrôle/i), '20');
    await user.type(screen.getByLabelText(/numéro d.urgence/i), '15');
    await user.click(screen.getByRole('button', { name: /enregistrer mon plan/i }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mutateAsync.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload.hypoSugarSource).toBe('3 morceaux de sucre');
    expect(payload.hyperRecheckMinutes).toBe(20);
    expect(payload.ketoEmergencyNumber).toBe('15');
  });

  it('blocks submission when recheck minutes is out of range', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/délai de recontrôle/i), '200');
    await user.click(screen.getByRole('button', { name: /enregistrer mon plan/i }));
    expect(await screen.findByText(/Au plus 120 minutes/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
