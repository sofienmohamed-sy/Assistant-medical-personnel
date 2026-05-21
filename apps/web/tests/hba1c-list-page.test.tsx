import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import type { StoredHbA1cMeasurement } from '@shared/measurements';
import HbA1cListPage from '@/pages/hba1c-list';

let mockData: StoredHbA1cMeasurement[] = [];
let mockIsLoading = false;

vi.mock('@/hooks/use-hba1c', () => ({
  useHbA1cMeasurements: () => ({
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
      <MemoryRouter initialEntries={['/measurements/hba1c']}>
        <AuthProvider>
          <HbA1cListPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<HbA1cListPage />', () => {
  it('renders the empty state when there is nothing yet', () => {
    mockData = [];
    mockIsLoading = false;
    renderList();
    expect(screen.getByTestId('hba1c-empty')).toBeVisible();
    expect(screen.getByTestId('hba1c-new-cta')).toBeVisible();
  });

  it('renders rows with formatted percent value and a delta vs the previous row', () => {
    // Newest first, oldest last (descending by measuredAt).
    mockData = [
      {
        id: 'h2',
        pathologyType: 'diabeteT2',
        measurementType: 'hba1c',
        unit: '%',
        value: 6.8,
        measuredAt: new Date('2026-04-15T10:00:00Z').toISOString(),
        createdAt: new Date(),
        labName: 'Cerballiance',
      },
      {
        id: 'h1',
        pathologyType: 'diabeteT2',
        measurementType: 'hba1c',
        unit: '%',
        value: 7.2,
        measuredAt: new Date('2026-01-15T10:00:00Z').toISOString(),
        createdAt: new Date(),
      },
    ];
    mockIsLoading = false;
    renderList();
    expect(screen.getByTestId('hba1c-list')).toBeVisible();
    expect(screen.getByTestId('hba1c-row-h2')).toHaveTextContent('6,8 %');
    // The first row (h2) is the most recent; its delta is computed against
    // the next-newer (i.e. the previous chronologically) row h1.
    expect(screen.getByTestId('hba1c-row-delta-h2')).toHaveTextContent(/−0,4 pt vs précédent/);
    // The oldest row (h1) has no previous → no delta element.
    expect(screen.queryByTestId('hba1c-row-delta-h1')).toBeNull();
    expect(screen.getByText('Cerballiance')).toBeVisible();
  });

  it('renders the loading state when fetching', () => {
    mockData = [];
    mockIsLoading = true;
    renderList();
    expect(screen.getByTestId('hba1c-loading')).toBeVisible();
  });
});
