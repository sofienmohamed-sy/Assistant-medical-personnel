import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import type { StoredMeasurement } from '@shared/measurements';
import GlycemiaListPage from '@/pages/glycemia-list';

let mockData: StoredMeasurement[] = [];
let mockIsLoading = false;

vi.mock('@/hooks/use-measurements', () => ({
  useGlycemiaMeasurements: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/measurements/glycemia']}>
        <AuthProvider>
          <GlycemiaListPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<GlycemiaListPage />', () => {
  it('renders the empty state when there are no measurements', () => {
    mockData = [];
    mockIsLoading = false;
    renderList();
    expect(screen.getByTestId('glycemia-empty')).toBeVisible();
    expect(screen.getByTestId('glycemia-new-cta')).toBeVisible();
  });

  it('renders a row per measurement with formatted value and moment', () => {
    mockData = [
      {
        id: 'm1',
        pathologyType: 'diabeteT2',
        measurementType: 'glycemia',
        unit: 'g/L',
        value: 1.42,
        moment: 'post-meal-2h',
        measuredAt: new Date('2026-01-15T10:30:00Z').toISOString(),
        createdAt: new Date('2026-01-15T10:31:00Z'),
        note: 'après le déjeuner',
      },
      {
        id: 'm2',
        pathologyType: 'diabeteT2',
        measurementType: 'glycemia',
        unit: 'g/L',
        value: 0.95,
        moment: 'fasting',
        measuredAt: new Date('2026-01-15T07:00:00Z').toISOString(),
        createdAt: new Date('2026-01-15T07:01:00Z'),
      },
    ];
    mockIsLoading = false;
    renderList();
    expect(screen.getByTestId('glycemia-list')).toBeVisible();
    expect(screen.getByTestId('glycemia-row-m1')).toHaveTextContent('1,42 g/L');
    expect(screen.getByTestId('glycemia-row-m1')).toHaveTextContent('2 h après un repas');
    expect(screen.getByTestId('glycemia-row-m2')).toHaveTextContent('0,95 g/L');
    expect(screen.getByTestId('glycemia-row-m2')).toHaveTextContent('À jeun');
    expect(screen.getByText('après le déjeuner')).toBeVisible();
  });

  it('renders the loading state', () => {
    mockData = [];
    mockIsLoading = true;
    renderList();
    expect(screen.getByTestId('glycemia-loading')).toBeVisible();
  });
});
