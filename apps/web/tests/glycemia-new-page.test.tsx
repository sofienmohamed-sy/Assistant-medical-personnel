import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import GlycemiaNewPage from '@/pages/glycemia-new';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-measurements', () => ({
  useAddGlycemiaMeasurement: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
  useGlycemiaMeasurements: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/measurements/glycemia/new']}>
        <AuthProvider>
          <GlycemiaNewPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<GlycemiaNewPage />', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders value, moment radios, datetime and note inputs', () => {
    renderForm();
    expect(screen.getByTestId('glycemia-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/glycémie/i)).toBeVisible();
    expect(screen.getByTestId('glycemia-moment-fasting')).toBeVisible();
    expect(screen.getByLabelText(/date et heure/i)).toBeVisible();
    expect(screen.getByLabelText(/note/i)).toBeVisible();
  });

  it('blocks submission with empty value + no moment', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByText(/Choisis le contexte/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('rejects a value above the plausible range', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/glycémie/i), '15');
    const fasting = screen.getByTestId('glycemia-moment-fasting').querySelector('input')!;
    await user.click(fasting);
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByText(/Valeur trop haute/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits a valid measurement to the mutation', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/glycémie/i), '1.45');
    const postMeal = screen.getByTestId('glycemia-moment-post-meal-2h').querySelector('input')!;
    await user.click(postMeal);
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mutateAsync.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload.pathologyType).toBe('diabeteT2');
    expect(payload.measurementType).toBe('glycemia');
    expect(payload.unit).toBe('g/L');
    expect(payload.value).toBeCloseTo(1.45, 2);
    expect(payload.moment).toBe('post-meal-2h');
    expect(typeof payload.measuredAt).toBe('string');
  });
});
