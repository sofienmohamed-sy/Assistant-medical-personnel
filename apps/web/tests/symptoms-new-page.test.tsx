import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import SymptomsNewPage from '@/pages/symptoms-new';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-symptoms', () => ({
  useAddDiabeteSymptomReport: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDiabeteSymptomReports: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-emergency-plan', () => ({
  useDiabeteEmergencyPlan: () => ({
    data: null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

let mockProfile: 'A' | 'B' | 'C' | 'D' | 'E' = 'D';
vi.mock('@/hooks/use-profile', () => ({
  useUserDoc: () => ({
    data: {
      profile: null,
      pathologies: { diabeteT2: { treatmentProfile: mockProfile, addedAt: new Date() } },
      pathologiesReviewedAt: new Date(),
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useProfile: () => ({ data: null }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/symptoms/new']}>
        <AuthProvider>
          <SymptomsNewPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<SymptomsNewPage />', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    mockProfile = 'D';
  });

  it('renders the four symptom categories', () => {
    renderPage();
    expect(screen.getByTestId('symptom-category-hypo')).toBeVisible();
    expect(screen.getByTestId('symptom-category-hyperChronic')).toBeVisible();
    expect(screen.getByTestId('symptom-category-acidocetose')).toBeVisible();
    expect(screen.getByTestId('symptom-category-severity')).toBeVisible();
  });

  it('disables the evaluate button until a symptom is checked', async () => {
    renderPage();
    const evaluate = screen.getByTestId('triage-evaluate');
    expect(evaluate).toBeDisabled();
    const sweats = within(screen.getByTestId('symptom-hypo:sweats')).getByRole('checkbox');
    const user = userEvent.setup();
    await user.click(sweats);
    expect(evaluate).not.toBeDisabled();
  });

  it('shows a level3b triage card when a severity sign is checked', async () => {
    const user = userEvent.setup();
    renderPage();
    const checkbox = within(screen.getByTestId('symptom-severity:loss-of-consciousness')).getByRole(
      'checkbox',
    );
    await user.click(checkbox);
    await user.click(screen.getByTestId('triage-evaluate'));
    const triage = await screen.findByTestId('triage-result');
    expect(within(triage).getByTestId('alert-badge-level3b')).toBeVisible();
    // The triage card may use the phrase in both the title span and the
    // message body — just check it appears at least once.
    expect(within(triage).getAllByText(/Urgence vitale/i).length).toBeGreaterThan(0);
  });

  it('shows a level3a hypo triage card on multiple hypo signs at risk profile', async () => {
    mockProfile = 'D';
    const user = userEvent.setup();
    renderPage();
    await user.click(within(screen.getByTestId('symptom-hypo:sweats')).getByRole('checkbox'));
    await user.click(within(screen.getByTestId('symptom-hypo:tremor')).getByRole('checkbox'));
    await user.click(screen.getByTestId('triage-evaluate'));
    const triage = await screen.findByTestId('triage-result');
    expect(within(triage).getByTestId('alert-badge-level3a')).toBeVisible();
  });

  it('downgrades the same hypo combo to level1 for a low-risk profile', async () => {
    mockProfile = 'A';
    const user = userEvent.setup();
    renderPage();
    await user.click(within(screen.getByTestId('symptom-hypo:sweats')).getByRole('checkbox'));
    await user.click(within(screen.getByTestId('symptom-hypo:tremor')).getByRole('checkbox'));
    await user.click(screen.getByTestId('triage-evaluate'));
    const triage = await screen.findByTestId('triage-result');
    expect(within(triage).getByTestId('alert-badge-level1')).toBeVisible();
  });

  it('persists the report when "Enregistrer ce signalement" is clicked after evaluating', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(screen.getByTestId('symptom-hypo:sweats')).getByRole('checkbox'));
    await user.click(screen.getByTestId('triage-evaluate'));
    await user.click(await screen.findByTestId('triage-save'));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mutateAsync.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload.pathologyType).toBe('diabeteT2');
    expect(payload.symptoms).toEqual(['hypo:sweats']);
    expect(typeof payload.reportedAt).toBe('string');
  });
});
