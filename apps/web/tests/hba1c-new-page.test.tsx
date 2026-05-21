import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import HbA1cNewPage from '@/pages/hba1c-new';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/use-hba1c', () => ({
  useAddHbA1cMeasurement: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  }),
  useHbA1cMeasurements: () => ({
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
      <MemoryRouter initialEntries={['/measurements/hba1c/new']}>
        <AuthProvider>
          <HbA1cNewPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<HbA1cNewPage />', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('renders the fields', () => {
    renderForm();
    expect(screen.getByTestId('hba1c-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/HbA1c/i)).toBeVisible();
    expect(screen.getByLabelText(/Date du prélèvement/i)).toBeVisible();
    expect(screen.getByLabelText(/Laboratoire/i)).toBeVisible();
  });

  it('blocks submission with no value', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByText(/Valeur invalide|Valeur trop/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('rejects a value above HBA1C_MAX', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/HbA1c/i), '25');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByText(/Valeur trop haute/i)).toBeVisible();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits a valid reading to the mutation', async () => {
    // The form accepts comma decimals via String.replace at runtime, but
    // jsdom's `<input type="number">` strips commas during user.type — so
    // the test uses a dot and the comma-handling is covered by the schema
    // tests + manual QA.
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/HbA1c/i), '6.8');
    await user.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mutateAsync.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload.pathologyType).toBe('diabeteT2');
    expect(payload.measurementType).toBe('hba1c');
    expect(payload.unit).toBe('%');
    expect(payload.value).toBeCloseTo(6.8, 2);
    expect(typeof payload.measuredAt).toBe('string');
  });
});
