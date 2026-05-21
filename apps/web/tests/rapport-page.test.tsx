import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import RapportDiabetePage from '@/pages/rapport-diabete';

const mockMeasurements: Array<{
  id: string;
  pathologyType: 'diabeteT2';
  measurementType: 'glycemia';
  unit: 'g/L';
  value: number;
  moment: 'fasting' | 'pre-meal' | 'post-meal-2h' | 'bedtime' | 'other';
  measuredAt: string;
  createdAt: Date;
}> = [];

const mockHbA1c: Array<{
  id: string;
  pathologyType: 'diabeteT2';
  measurementType: 'hba1c';
  unit: '%';
  value: number;
  measuredAt: string;
  createdAt: Date;
  labName?: string;
}> = [];

vi.mock('@/hooks/use-measurements', () => ({
  useGlycemiaMeasurements: () => ({
    data: mockMeasurements,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useAddGlycemiaMeasurement: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/hooks/use-hba1c', () => ({
  useHbA1cMeasurements: () => ({
    data: mockHbA1c,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useAddHbA1cMeasurement: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
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
      profile: {
        uid: 'u',
        prenom: 'Sofien',
        nom: 'Mohamed',
        dateOfBirth: '1990-05-12',
        countryOfResidence: 'FR',
        countryOfOrigin: 'FR',
        profession: 'développeur',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      pathologies: { diabeteT2: { treatmentProfile: 'D', addedAt: new Date() } },
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
      <MemoryRouter initialEntries={['/diabete/rapport']}>
        <AuthProvider>
          <RapportDiabetePage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<RapportDiabetePage />', () => {
  it('renders identity, pathology, glycemia/hba1c/symptom sections', () => {
    mockMeasurements.length = 0;
    mockHbA1c.length = 0;
    renderPage();
    expect(screen.getByTestId('rapport-card')).toBeVisible();
    expect(screen.getByTestId('rapport-identity')).toBeVisible();
    expect(screen.getByTestId('rapport-pathology')).toBeVisible();
    expect(screen.getByTestId('rapport-glycemia')).toBeVisible();
    expect(screen.getByTestId('rapport-hba1c')).toBeVisible();
    expect(screen.getByTestId('rapport-symptoms')).toBeVisible();
    // Profile values surfaced
    expect(
      within(screen.getByTestId('rapport-identity')).getByText('Sofien Mohamed'),
    ).toBeVisible();
    // Treatment profile letter exposed
    expect(within(screen.getByTestId('rapport-pathology')).getByText(/Profil/)).toBeVisible();
    expect(within(screen.getByTestId('rapport-pathology')).getByText('D')).toBeVisible();
  });

  it('summarises glycémie counts when data is present', () => {
    mockMeasurements.length = 0;
    const now = Date.now();
    // 3 measurements in the last 4 weeks; one in target, one moderate, one high.
    mockMeasurements.push(
      {
        id: 'g1',
        pathologyType: 'diabeteT2',
        measurementType: 'glycemia',
        unit: 'g/L',
        value: 1.0,
        moment: 'fasting',
        measuredAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(),
      },
      {
        id: 'g2',
        pathologyType: 'diabeteT2',
        measurementType: 'glycemia',
        unit: 'g/L',
        value: 1.7,
        moment: 'post-meal-2h',
        measuredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(),
      },
      {
        id: 'g3',
        pathologyType: 'diabeteT2',
        measurementType: 'glycemia',
        unit: 'g/L',
        value: 3.3,
        moment: 'post-meal-2h',
        measuredAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(),
      },
    );
    mockHbA1c.length = 0;
    renderPage();
    expect(within(screen.getByTestId('rapport-glyc-count')).getByText('3')).toBeVisible();
    expect(within(screen.getByTestId('rapport-glyc-high')).getByText('1')).toBeVisible();
  });

  it('renders HbA1c history rows when data is present', () => {
    mockMeasurements.length = 0;
    mockHbA1c.length = 0;
    mockHbA1c.push(
      {
        id: 'h1',
        pathologyType: 'diabeteT2',
        measurementType: 'hba1c',
        unit: '%',
        value: 6.8,
        measuredAt: new Date('2026-04-15T10:00:00Z').toISOString(),
        createdAt: new Date(),
        labName: 'Cerballiance',
      },
      {
        id: 'h2',
        pathologyType: 'diabeteT2',
        measurementType: 'hba1c',
        unit: '%',
        value: 7.2,
        measuredAt: new Date('2026-01-15T10:00:00Z').toISOString(),
        createdAt: new Date(),
      },
    );
    renderPage();
    const hba1cSection = screen.getByTestId('rapport-hba1c');
    expect(within(hba1cSection).getByText('Cerballiance', { exact: false })).toBeVisible();
    expect(within(hba1cSection).getByText(/6,8\s*%/)).toBeVisible();
    expect(within(hba1cSection).getByText(/7,2\s*%/)).toBeVisible();
  });

  it('exposes the print button and the period picker', () => {
    mockMeasurements.length = 0;
    mockHbA1c.length = 0;
    renderPage();
    expect(screen.getByTestId('rapport-print-cta')).toBeVisible();
    expect(screen.getByTestId('rapport-period-picker')).toBeVisible();
  });
});
