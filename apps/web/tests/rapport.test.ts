import { describe, it, expect } from 'vitest';
import { buildPeriod, computeDiabeteRapport, RAPPORT_PERIOD_PRESETS } from '@shared/index';
import type { GlycemiaMoment } from '@shared/measurements';

const now = new Date('2026-05-21T18:00:00Z');

function daysAgo(d: number): string {
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
}

function m(
  d: number,
  value: number,
  moment: GlycemiaMoment = 'fasting',
): { measuredAt: string; value: number; moment: GlycemiaMoment } {
  return { measuredAt: daysAgo(d), value, moment };
}

describe('buildPeriod', () => {
  it('uses 28 days for "4w" and 84 days for "12w"', () => {
    const fourW = buildPeriod('4w', now);
    expect(fourW.endMs).toBe(now.getTime());
    expect(now.getTime() - fourW.startMs).toBe(28 * 24 * 60 * 60 * 1000);
    const twelveW = buildPeriod('12w', now);
    expect(now.getTime() - twelveW.startMs).toBe(84 * 24 * 60 * 60 * 1000);
  });

  it('exposes presets in the expected order', () => {
    expect(RAPPORT_PERIOD_PRESETS.map((p) => p.code)).toEqual(['4w', '12w']);
  });
});

describe('computeDiabeteRapport — glycémie summary', () => {
  it('counts only measurements inside the period', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [m(2, 1.1), m(10, 1.05), m(40, 2.5)], // 40d ago outside 4w
      symptomReports: [],
      hba1cMeasurements: [],
    });
    expect(r.glycemia.count).toBe(2);
  });

  it('computes mean / min / max correctly', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [m(1, 1.0), m(2, 1.2), m(3, 1.5)],
      symptomReports: [],
      hba1cMeasurements: [],
    });
    expect(r.glycemia.meanGperL!).toBeCloseTo(1.2333, 3);
    expect(r.glycemia.minGperL).toBe(1.0);
    expect(r.glycemia.maxGperL).toBe(1.5);
  });

  it('counts > 2 g/L events and severe hypos per profile', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'D', // insulin → hypo risk
      measurements: [m(1, 0.4), m(3, 0.65), m(5, 2.2), m(7, 3.6)],
      symptomReports: [],
      hba1cMeasurements: [],
    });
    expect(r.glycemia.highValueCount).toBe(2); // 2.2 + 3.6 both > 2
    // 0.4 (< 0.5) + 0.65 (< 0.7 on profile D) → 2
    expect(r.glycemia.severeHypoCount).toBe(2);
  });

  it('builds countByLevel using the per-reading alert engine', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [m(1, 1.0, 'fasting'), m(2, 1.7, 'post-meal-2h'), m(3, 3.3, 'post-meal-2h')],
      symptomReports: [],
      hba1cMeasurements: [],
    });
    expect(r.glycemia.countByLevel.normal).toBe(1);
    expect(r.glycemia.countByLevel.level1).toBe(1);
    expect(r.glycemia.countByLevel.level3a).toBe(1);
  });

  it('returns nulls when no measurements', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [],
      symptomReports: [],
      hba1cMeasurements: [],
    });
    expect(r.glycemia.meanGperL).toBeNull();
    expect(r.glycemia.minGperL).toBeNull();
    expect(r.glycemia.maxGperL).toBeNull();
    expect(r.glycemia.inTargetRatio).toBeNull();
  });
});

describe('computeDiabeteRapport — symptom summary', () => {
  it('counts reports inside period and derives worst level', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [],
      symptomReports: [
        { reportedAt: daysAgo(2), symptoms: ['hypo:tremor'] },
        { reportedAt: daysAgo(5), symptoms: ['severity:loss-of-consciousness'] },
        { reportedAt: daysAgo(50), symptoms: ['hyper:fatigue'] }, // outside window
      ],
      hba1cMeasurements: [],
    });
    expect(r.symptoms.reportCount).toBe(2);
    expect(r.symptoms.worstLevel).toBe('level3b');
  });

  it('aggregates by category', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [],
      symptomReports: [
        { reportedAt: daysAgo(1), symptoms: ['hypo:tremor', 'hyper:fatigue'] },
        { reportedAt: daysAgo(2), symptoms: ['acido:nausea'] },
      ],
      hba1cMeasurements: [],
    });
    expect(r.symptoms.byCategory.hypo).toBe(1);
    expect(r.symptoms.byCategory.hyperChronic).toBe(1);
    expect(r.symptoms.byCategory.acidocetose).toBe(1);
    expect(r.symptoms.byCategory.severity).toBe(0);
  });
});

describe('computeDiabeteRapport — HbA1c', () => {
  it('returns the latest reading regardless of period', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [],
      symptomReports: [],
      hba1cMeasurements: [
        { measuredAt: daysAgo(120), value: 7.2 },
        { measuredAt: daysAgo(40), value: 6.8 },
        { measuredAt: daysAgo(5), value: 6.5, labName: 'Cerballiance' },
      ],
    });
    expect(r.hba1cLatest?.value).toBe(6.5);
    expect(r.hba1cLatest?.labName).toBe('Cerballiance');
    expect(r.hba1cHistory).toHaveLength(3);
    // Descending order
    expect(r.hba1cHistory[0]!.value).toBe(6.5);
    expect(r.hba1cHistory[2]!.value).toBe(7.2);
  });

  it('returns nulls / empty when no HbA1c yet', () => {
    const r = computeDiabeteRapport({
      period: buildPeriod('4w', now),
      treatmentProfile: 'B',
      measurements: [],
      symptomReports: [],
      hba1cMeasurements: [],
    });
    expect(r.hba1cLatest).toBeNull();
    expect(r.hba1cHistory).toHaveLength(0);
  });
});
