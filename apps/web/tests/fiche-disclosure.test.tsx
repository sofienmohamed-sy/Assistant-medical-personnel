import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FicheDisclosure } from '@/components/alerts/fiche-disclosure';
import type { Fiche } from '@shared/fiches';

const sampleFiche: Fiche = {
  id: 'sample',
  title: 'Comprendre le sucre',
  tagline: 'Pourquoi le sucre c’est sucré.',
  sections: [
    {
      question: 'Pourquoi le sucre est-il sucré ?',
      body: 'Le sucre stimule les récepteurs T1R2/T1R3 sur la langue.\n\nLes différences inter-individuelles existent.',
    },
    {
      question: 'Quand s’en méfier ?',
      body: 'Au-delà d’une certaine quantité quotidienne, le métabolisme glucidique en souffre.',
    },
  ],
  sources: ['HAS — Note pédagogique factice', 'SFD — Recommandations 2024'],
};

describe('<FicheDisclosure />', () => {
  it('renders as collapsed by default, exposing the tagline in the summary', () => {
    render(<FicheDisclosure fiche={sampleFiche} />);
    const root = screen.getByTestId('fiche-disclosure');
    expect(root).toBeInTheDocument();
    expect(root).not.toHaveAttribute('open');
    expect(screen.getByText('Pourquoi le sucre c’est sucré.')).toBeInTheDocument();
  });

  it('expands when the summary is clicked and reveals the title + section questions + sources', async () => {
    const user = userEvent.setup();
    render(<FicheDisclosure fiche={sampleFiche} />);
    await user.click(screen.getByText(/En savoir plus/i));
    expect(screen.getByTestId('fiche-disclosure')).toHaveAttribute('open');
    expect(screen.getByText('Comprendre le sucre')).toBeInTheDocument();
    expect(screen.getByTestId('fiche-disclosure-section-0')).toBeInTheDocument();
    expect(screen.getByTestId('fiche-disclosure-section-1')).toBeInTheDocument();
    expect(screen.getByText(/Pourquoi le sucre est-il sucré/i)).toBeInTheDocument();
    expect(screen.getByText(/Quand s.en méfier/i)).toBeInTheDocument();
    expect(screen.getByText('HAS — Note pédagogique factice')).toBeInTheDocument();
    expect(screen.getByText('SFD — Recommandations 2024')).toBeInTheDocument();
  });

  it('includes the "pending medical validation" disclaimer', async () => {
    const user = userEvent.setup();
    render(<FicheDisclosure fiche={sampleFiche} />);
    await user.click(screen.getByText(/En savoir plus/i));
    expect(screen.getByText(/validation médicale/i)).toBeInTheDocument();
  });
});
