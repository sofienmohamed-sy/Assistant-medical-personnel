import { describe, it, expect } from 'vitest';
import { FICHES, getFicheForReason } from '@shared/fiches';
import { computeGlycemiaAlert } from '@shared/alerts';
import { GLYCEMIA_MOMENTS } from '@shared/measurements';
import { DIABETE_T2_PROFILES } from '@shared/pathologies';

describe('FICHES — content sanity', () => {
  it('every fiche has an id, title, tagline, at least one section, sources', () => {
    for (const [key, fiche] of Object.entries(FICHES)) {
      expect(fiche.id, `${key} missing id`).toBe(key);
      expect(fiche.title, `${key} missing title`).toBeTruthy();
      expect(fiche.tagline, `${key} missing tagline`).toBeTruthy();
      expect(fiche.sections.length, `${key} has no sections`).toBeGreaterThanOrEqual(2);
      expect(fiche.sources.length, `${key} has no sources`).toBeGreaterThanOrEqual(1);
      for (const section of fiche.sections) {
        expect(section.question, `${key} section without question`).toBeTruthy();
        expect(section.body.length, `${key} section without body`).toBeGreaterThan(20);
      }
    }
  });

  it('every fiche cites at least one identifiable public source', () => {
    const SOURCE_PATTERN =
      /HAS|SFD|Soci[ée]t[ée] Francophone du Diab[èe]te|INSERM|F[eé]d[eé]ration Fran[çc]aise des Diab[ée]tiques/i;
    for (const [key, fiche] of Object.entries(FICHES)) {
      const matches = fiche.sources.some((s) => SOURCE_PATTERN.test(s));
      expect(matches, `${key} has no identifiable public source`).toBe(true);
    }
  });
});

describe('getFicheForReason', () => {
  it('returns null for "in-target"', () => {
    expect(getFicheForReason('in-target')).toBeNull();
  });

  it('returns null for unknown reason codes', () => {
    expect(getFicheForReason('does-not-exist')).toBeNull();
  });

  it('returns the hypo fiche for severe-hypo and hypo-resucrage', () => {
    expect(getFicheForReason('severe-hypo')?.id).toBe('glycemia-hypoglycemia');
    expect(getFicheForReason('hypo-resucrage')?.id).toBe('glycemia-hypoglycemia');
  });

  it('returns the post-meal fiche for every postmeal-* reason', () => {
    expect(getFicheForReason('postmeal-very-high')?.id).toBe('glycemia-postmeal-high');
    expect(getFicheForReason('postmeal-high')?.id).toBe('glycemia-postmeal-high');
    expect(getFicheForReason('postmeal-above-target')?.id).toBe('glycemia-postmeal-high');
  });

  it('returns the fasting fiche for every fasting-* reason', () => {
    expect(getFicheForReason('fasting-very-high')?.id).toBe('glycemia-fasting-high');
    expect(getFicheForReason('fasting-high')?.id).toBe('glycemia-fasting-high');
    expect(getFicheForReason('fasting-above-target')?.id).toBe('glycemia-fasting-high');
  });

  it('returns the severe-hyper fiche for severe-hyper', () => {
    expect(getFicheForReason('severe-hyper')?.id).toBe('glycemia-severe-hyper');
  });
});

describe('coverage — every non-normal alert reasonCode has a fiche', () => {
  // Walk a sample grid of plausible measurements and assert that every
  // reasonCode the engine can produce (except "in-target") has a matching
  // fiche. Guards against future engine additions that forget their fiche.
  it('produces a fiche for every reason code the engine emits at non-normal levels', () => {
    const sampleValues = [0.3, 0.6, 0.95, 1.5, 1.8, 2.1, 2.6, 3.1, 4.0];
    const reasonsSeen = new Set<string>();
    for (const value of sampleValues) {
      for (const moment of GLYCEMIA_MOMENTS) {
        for (const profile of DIABETE_T2_PROFILES) {
          const r = computeGlycemiaAlert({ value, moment }, profile);
          if (r.level !== 'normal') reasonsSeen.add(r.reasonCode);
        }
      }
    }
    expect(reasonsSeen.size).toBeGreaterThan(0);
    for (const code of reasonsSeen) {
      const fiche = getFicheForReason(code);
      expect(fiche, `missing fiche for reasonCode "${code}"`).not.toBeNull();
    }
  });
});
