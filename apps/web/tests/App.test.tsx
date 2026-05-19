import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('<App />', () => {
  it('renders the landing card with the app name', () => {
    render(<App />);
    expect(screen.getByTestId('landing-card')).toBeInTheDocument();
    expect(screen.getByText('Assistant médical personnel')).toBeInTheDocument();
  });

  it('shows Firebase status indicator', () => {
    render(<App />);
    expect(screen.getByTestId('firebase-status')).toBeInTheDocument();
  });
});
