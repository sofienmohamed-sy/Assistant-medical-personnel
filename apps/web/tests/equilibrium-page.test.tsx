import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import EquilibriumPage from '@/pages/equilibrium';

const measurements: Array<{
  id: string;
  pathologyType: 'diabeteT2';
  measurementType: 'glycemia';
  unit: 'g/L';
  value: number;
  moment: 'fasting' | 'pre-meal' | 'post-meal-2h' | 'bedtime' | 'other';
  measuredAt: string;
  createdAt: Date;
}> = [];

vi.mock('@/hooks/use-measurements', () => ({
  useGlycemiaMeasurements: () => ({
    data: measurements,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-symptoms', () => ({
  useDiabeteSymptomReports: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useAddDiabeteSymptomReport: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useUserDoc: () => ({
    data: {
      profile: null,
      pathologies: { diabeteT2: { treatmentProfile: 'B', addedAt: new Date() } },
      pathologiesReviewedAt: new Date(),
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/diabete/equilibrium']}>
        <AuthProvider>
          <EquilibriumPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<EquilibriumPage />', () => {
  it('renders the card and the explainer with no internal label leaked', () => {
    measurements.length = 0; // not-enough-data path
    renderPage();
    expect(screen.getByTestId('equilibrium-card')).toBeVisible();
    expect(screen.getByTestId('equilibrium-presence')).toBeVisible();
    // §7.6 — must not display the clinical state word.
    expect(screen.queryByText(/déséquilibre/i)).toBeNull();
  });

  it('shows the empty-data presence message when no measurements', () => {
    measurements.length = 0;
    renderPage();
    expect(screen.getByText(/Pas encore assez de données/i)).toBeVisible();
  });

  it('shows factual signal lines and never displays an HbA1c value', () => {
    measurements.length = 0;
    // 12 measurements over ~70 days — enough to compute eHbA1c internally.
    const now = Date.now();
    for (let i = 0; i < 12; i++) {
      measurements.push({
        id: `m-${i}`,
        pathologyType: 'diabeteT2',
        measurementType: 'glycemia',
        unit: 'g/L',
        value: 1.0,
        moment: 'fasting',
        measuredAt: new Date(now - i * 6 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(),
      });
    }
    renderPage();
    expect(screen.getByTestId('equilibrium-signals')).toBeVisible();
    // §4.5 — internal indicator never shown.
    expect(screen.queryByText(/HbA1c/i)).toBeNull();
    expect(screen.queryByText(/hémoglobine glyquée/i)).toBeNull();
  });
});
