import { describe, it, expect } from 'vitest';
import {
  computeDiabeteEquilibrium,
  explainEquilibriumPresence,
  type DiabeteSymptomCode,
} from '@shared/index';
import type { DiabeteT2Profile, GlycemiaMoment } from '@shared/index';

const now = new Date('2026-05-21T18:00:00Z');

function daysAgo(d: number): string {
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
}

function measurement(
  daysBack: number,
  value: number,
  moment: GlycemiaMoment = 'fasting',
): { measuredAt: string; value: number; moment: GlycemiaMoment } {
  return { measuredAt: daysAgo(daysBack), value, moment };
}

function symptom(
  daysBack: number,
  symptoms: DiabeteSymptomCode[],
): { reportedAt: string; symptoms: DiabeteSymptomCode[] } {
  return { reportedAt: daysAgo(daysBack), symptoms };
}

function run(
  measurements: ReturnType<typeof measurement>[],
  symptomReports: ReturnType<typeof symptom>[] = [],
  treatmentProfile: DiabeteT2Profile = 'B',
) {
  return computeDiabeteEquilibrium({ measurements, symptomReports, treatmentProfile, now });
}

describe('computeDiabeteEquilibrium — windowing', () => {
  it('returns unknown when fewer than 5 measurements in 30 days', () => {
    const r = run([measurement(1, 1.0), measurement(2, 1.1), measurement(3, 1.0)]);
    expect(r.state).toBe('unknown');
    expect(r.measurementCount30d).toBe(3);
    expect(r.signals.some((s) => s.code === 'not-enough-data')).toBe(true);
  });

  it('ignores measurements older than 30 days', () => {
    const r = run([
      measurement(0, 1.0),
      measurement(2, 1.05),
      measurement(5, 1.1),
      measurement(10, 0.95),
      measurement(20, 1.05),
      measurement(45, 3.5), // outside window, must not influence the state
    ]);
    expect(r.measurementCount30d).toBe(5);
    expect(r.state).toBe('balanced');
  });
});

describe('computeDiabeteEquilibrium — balanced vs slipping vs severe', () => {
  it('balanced when ≥ 80% in target and no extreme events', () => {
    // 8 in target out of 10 = 80%
    const ms = [
      measurement(0, 1.0),
      measurement(2, 1.1),
      measurement(4, 0.95),
      measurement(6, 1.2),
      measurement(8, 0.9),
      measurement(10, 1.05),
      measurement(12, 1.0),
      measurement(14, 1.1),
      measurement(16, 1.7), // hors cible
      measurement(18, 1.8), // hors cible (post-meal classified non-target since moment defaults fasting)
    ];
    const r = run(ms);
    expect(r.state).toBe('balanced');
  });

  it('slipping when < 70% in target', () => {
    const ms = [
      measurement(0, 1.6),
      measurement(2, 1.7),
      measurement(4, 1.8),
      measurement(6, 2.1),
      measurement(8, 1.9),
      measurement(10, 1.05),
      measurement(12, 1.0),
      measurement(14, 1.1),
    ];
    const r = run(ms);
    expect(r.state).toBe('slipping');
  });

  it('severe when ≥ 3 readings above 3 g/L on 30 days', () => {
    const ms = [
      measurement(0, 3.2),
      measurement(3, 3.1),
      measurement(6, 3.3),
      measurement(8, 1.0),
      measurement(10, 1.1),
    ];
    const r = run(ms);
    expect(r.state).toBe('severe');
  });

  it('severe when ≥ 2 severe-hypo events on 14 days for a hypo-risk profile', () => {
    const ms = [
      measurement(1, 0.4), // severe hypo
      measurement(3, 0.45), // severe hypo
      measurement(5, 1.0),
      measurement(7, 1.1),
      measurement(10, 1.05),
    ];
    const r = run(ms, [], 'D');
    expect(r.severeHypoCount30d).toBeGreaterThanOrEqual(2);
    expect(r.state).toBe('severe');
  });

  it('severe escalates when a level3b symptom report sits in the last 30 days', () => {
    const ms = [
      measurement(1, 1.0),
      measurement(3, 1.1),
      measurement(5, 1.0),
      measurement(7, 1.0),
      measurement(10, 1.05),
    ];
    const r = computeDiabeteEquilibrium({
      measurements: ms,
      symptomReports: [{ ...symptom(2, ['severity:loss-of-consciousness']), level: 'level3b' }],
      treatmentProfile: 'B',
      now,
    });
    expect(r.state).toBe('severe');
  });
});

describe('computeDiabeteEquilibrium — eHbA1c', () => {
  it('returns null when fewer than 10 measurements or span < 60 days', () => {
    const r = run([
      measurement(0, 1.0),
      measurement(2, 1.1),
      measurement(5, 1.0),
      measurement(8, 1.1),
      measurement(11, 1.0),
    ]);
    expect(r.estimatedHbA1cPercent).toBeNull();
  });

  it('computes eHbA1c from the ADA eAG formula when enough data', () => {
    // 12 measurements spread over 70 days, mean ~1.0 g/L → ~100 mg/dL
    // eHbA1c% = (100 + 46.7) / 28.7 ≈ 5.1%
    const ms = Array.from({ length: 12 }, (_, i) => measurement(i * 6, 1.0));
    const r = run(ms);
    expect(r.estimatedHbA1cPercent).not.toBeNull();
    expect(r.estimatedHbA1cPercent!).toBeGreaterThan(4.8);
    expect(r.estimatedHbA1cPercent!).toBeLessThan(5.3);
  });
});

describe('computeDiabeteEquilibrium — signal list never leaks the eHbA1c value', () => {
  it('signal codes are factual counters, not the estimated indicator', () => {
    const ms = Array.from({ length: 12 }, (_, i) => measurement(i * 6, 1.0));
    const r = run(ms);
    for (const signal of r.signals) {
      // §4.5: the estimated HbA1c is never displayed to the user as a precise
      // value. The signal list is what the UI surfaces. Make sure it doesn't.
      expect(signal.fr).not.toMatch(/HbA1c/i);
      expect(signal.fr).not.toMatch(/hémoglobine glyquée/i);
    }
  });
});

describe('explainEquilibriumPresence — never names the internal state', () => {
  it('does not leak the clinical label "déséquilibre" / "équilibre" to the user', () => {
    // §7.6 — the patient sees behaviour ("plus présente" / "discrète"), not
    // a clinical label.
    for (const state of ['balanced', 'slipping', 'severe', 'unknown'] as const) {
      const { title, body } = explainEquilibriumPresence(state);
      expect(title).not.toMatch(/déséquilibre/i);
      expect(body).not.toMatch(/déséquilibre/i);
    }
  });

  it('returns distinct copy per state', () => {
    const seen = new Set<string>();
    for (const state of ['balanced', 'slipping', 'severe', 'unknown'] as const) {
      const { title } = explainEquilibriumPresence(state);
      expect(seen.has(title)).toBe(false);
      seen.add(title);
    }
  });
});
