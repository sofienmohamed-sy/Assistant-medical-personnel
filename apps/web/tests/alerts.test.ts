import { describe, it, expect } from 'vitest';
import { ALERT_LEVEL_RANK, computeGlycemiaAlert, computeGlycemiaTendance } from '@shared/alerts';
import type { DiabeteT2Profile, GlycemiaMoment } from '@shared/index';

function alert(value: number, moment: GlycemiaMoment, profile: DiabeteT2Profile = 'B') {
  return computeGlycemiaAlert({ value, moment }, profile);
}

describe('computeGlycemiaAlert — extremes', () => {
  it('severe hypo (< 0.5 g/L) is level 3b regardless of profile', () => {
    for (const p of ['A', 'B', 'C', 'D', 'E'] as const) {
      expect(alert(0.4, 'fasting', p).level).toBe('level3b');
    }
  });

  it('severe hyper (> 3.5 g/L) is level 3b regardless of profile / moment', () => {
    expect(alert(3.6, 'fasting').level).toBe('level3b');
    expect(alert(4.5, 'post-meal-2h', 'E').level).toBe('level3b');
  });

  it('value in target returns normal', () => {
    expect(alert(0.95, 'fasting').level).toBe('normal');
    expect(alert(1.25, 'post-meal-2h').level).toBe('normal');
    expect(alert(0.95, 'fasting', 'E').level).toBe('normal');
  });
});

describe('computeGlycemiaAlert — hypo zone (0.5–0.7 g/L)', () => {
  it('escalates to level 3a for hypo-risk profiles (C, D, E)', () => {
    for (const p of ['C', 'D', 'E'] as const) {
      expect(alert(0.6, 'fasting', p).level).toBe('level3a');
      expect(alert(0.6, 'fasting', p).reasonCode).toBe('hypo-resucrage');
    }
  });

  it('stays normal for low-risk profiles (A, B)', () => {
    for (const p of ['A', 'B'] as const) {
      // 0.6 is below the usual "in target" min but the engine deliberately
      // does NOT flag it as 3a/3b for these profiles — no hypo risk.
      expect(alert(0.6, 'fasting', p).level).toBe('normal');
    }
  });
});

describe('computeGlycemiaAlert — fasting / pre-meal / bedtime thresholds', () => {
  it.each<[GlycemiaMoment]>([['fasting'], ['pre-meal'], ['bedtime']])(
    'classifies the same way for %s context',
    (moment) => {
      expect(alert(1.5, moment).level).toBe('level1');
      expect(alert(2.2, moment).level).toBe('level1');
      expect(alert(2.6, moment).level).toBe('level3a');
    },
  );
});

describe('computeGlycemiaAlert — post-meal thresholds', () => {
  it('treats > 1.4 and ≤ 2 as level 1', () => {
    expect(alert(1.7, 'post-meal-2h').level).toBe('level1');
    expect(alert(1.7, 'post-meal-2h').reasonCode).toBe('postmeal-above-target');
  });

  it('treats > 2 and ≤ 3 as level 1 (repetition handled by tendance)', () => {
    expect(alert(2.5, 'post-meal-2h').level).toBe('level1');
    expect(alert(2.5, 'post-meal-2h').reasonCode).toBe('postmeal-high');
  });

  it('treats > 3 as level 3a urgence relative', () => {
    expect(alert(3.1, 'post-meal-2h').level).toBe('level3a');
    expect(alert(3.1, 'post-meal-2h').reasonCode).toBe('postmeal-very-high');
  });
});

describe('computeGlycemiaAlert — message + sources', () => {
  it('always cites HAS / SFD', () => {
    const a = alert(1.2, 'fasting');
    expect(a.sources.some((s) => /HAS/i.test(s))).toBe(true);
  });

  it('formats values with the French comma decimal', () => {
    const a = alert(1.45, 'post-meal-2h');
    expect(a.message).toContain('1,45');
  });
});

describe('computeGlycemiaTendance', () => {
  const now = new Date('2026-05-21T18:00:00Z');

  function within(
    daysAgo: number,
    value = 1.0,
    level: 'normal' | 'level1' | 'level2' | 'level3a' | 'level3b' = 'normal',
  ) {
    return {
      measuredAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      value,
      level,
    };
  }

  it('counts only measurements in the last 7 days', () => {
    const t = computeGlycemiaTendance({
      classified: [
        within(0, 1.1, 'normal'),
        within(3, 2.1, 'level1'),
        within(6.5, 0.95, 'normal'),
        within(8, 3.5, 'level3a'), // outside window, ignored
      ],
      now,
    });
    expect(t.totalLast7Days).toBe(3);
    expect(t.abnormalLast7Days).toBe(1);
  });

  it('escalates max level to level2 when ≥ 3 readings exceed 2 g/L within the window', () => {
    const t = computeGlycemiaTendance({
      classified: [within(0, 2.4, 'level1'), within(2, 2.1, 'level1'), within(5, 2.3, 'level1')],
      now,
    });
    expect(t.highValueCountLast7Days).toBe(3);
    expect(t.highValueRepeatedAlertActive).toBe(true);
    expect(t.maxLevelLast7Days).toBe('level2');
  });

  it('keeps individual max level when a single 3a / 3b shows up', () => {
    const t = computeGlycemiaTendance({
      classified: [within(0, 3.6, 'level3b'), within(2, 1.0, 'normal')],
      now,
    });
    expect(t.maxLevelLast7Days).toBe('level3b');
  });

  it('returns zeros on an empty list', () => {
    const t = computeGlycemiaTendance({ classified: [], now });
    expect(t.totalLast7Days).toBe(0);
    expect(t.abnormalLast7Days).toBe(0);
    expect(t.maxLevelLast7Days).toBe('normal');
  });
});

describe('ALERT_LEVEL_RANK', () => {
  it('orders levels strictly increasingly', () => {
    const ranks = ['normal', 'level1', 'level2', 'level3a', 'level3b'].map(
      (l) => ALERT_LEVEL_RANK[l as keyof typeof ALERT_LEVEL_RANK],
    );
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]!).toBeGreaterThan(ranks[i - 1]!);
    }
  });
});
