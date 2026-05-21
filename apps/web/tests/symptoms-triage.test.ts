import { describe, it, expect } from 'vitest';
import {
  computeDiabeteSymptomTriage,
  DIABETE_SYMPTOM_CODES,
  diabeteSymptomReportSchema,
  type DiabeteSymptomCode,
} from '@shared/symptoms';
import type { DiabeteT2Profile } from '@shared/pathologies';

function triage(codes: DiabeteSymptomCode[], profile: DiabeteT2Profile = 'B') {
  return computeDiabeteSymptomTriage(codes, profile);
}

describe('computeDiabeteSymptomTriage — gravité (level 3b)', () => {
  it('any severity symptom alone is level 3b regardless of profile', () => {
    for (const p of ['A', 'B', 'C', 'D', 'E'] as const) {
      expect(triage(['severity:consciousness-trouble'], p).level).toBe('level3b');
      expect(triage(['severity:convulsions'], p).level).toBe('level3b');
      expect(triage(['severity:loss-of-consciousness'], p).level).toBe('level3b');
    }
  });

  it('severity always recommends calling 15', () => {
    const r = triage(['severity:loss-of-consciousness']);
    expect(r.recommendation).toMatch(/15/);
    expect(r.nextActions.some((a) => /15/.test(a))).toBe(true);
  });
});

describe('computeDiabeteSymptomTriage — acidocétose', () => {
  it('full triad (kussmaul + nausea + fruity breath) is level 3b', () => {
    const r = triage(['acido:kussmaul', 'acido:nausea', 'acido:fruity-breath']);
    expect(r.level).toBe('level3b');
    expect(r.reasonCode).toBe('symptom-acidocetose-severe');
  });

  it('full triad with vomiting (instead of nausea) is also level 3b', () => {
    const r = triage(['acido:kussmaul', 'acido:vomiting', 'acido:fruity-breath']);
    expect(r.level).toBe('level3b');
  });

  it('two acidocétose symptoms (no full triad) is level 3a', () => {
    const r = triage(['acido:nausea', 'acido:abdominal-pain']);
    expect(r.level).toBe('level3a');
    expect(r.reasonCode).toBe('symptom-acidocetose-suspected');
  });

  it('one acidocétose symptom is level 2 (isolated)', () => {
    const r = triage(['acido:fruity-breath']);
    expect(r.level).toBe('level2');
    expect(r.reasonCode).toBe('symptom-acidocetose-isolated');
  });
});

describe('computeDiabeteSymptomTriage — hypoglycémie', () => {
  it('multiple hypo signs at hypo-risk profile = level 3a, routed to personal plan', () => {
    // Per spec §2.1 the engine must NOT prescribe a treatment in its own
    // voice; it points the patient at their own plan d'urgence personnel
    // and at safety / emergency services.
    for (const p of ['C', 'D', 'E'] as const) {
      const r = triage(['hypo:sweats', 'hypo:tremor'], p);
      expect(r.level).toBe('level3a');
      expect(r.reasonCode).toBe('symptom-hypo-multi');
      expect(r.recommendation).toMatch(/plan d’urgence personnel/i);
      expect(r.recommendation).not.toMatch(/sucre rapide/i);
      expect(r.recommendation).not.toMatch(/resucre-toi/i);
    }
  });

  it('single hypo sign at hypo-risk profile = level 2 (mesure ta glycémie)', () => {
    const r = triage(['hypo:dizziness'], 'D');
    expect(r.level).toBe('level2');
    expect(r.reasonCode).toBe('symptom-hypo-single');
  });

  it('single hypo sign at low-risk profile = level 1', () => {
    for (const p of ['A', 'B'] as const) {
      const r = triage(['hypo:dizziness'], p);
      expect(r.level).toBe('level1');
      expect(r.reasonCode).toBe('symptom-hypo-low-risk');
    }
  });

  it('multiple hypo signs at low-risk profile = level 1 (not 3a)', () => {
    // Important: profile A users on hygiéno-diététique have no hypo risk.
    // The engine must NOT escalate them as if they were on insulin.
    const r = triage(['hypo:sweats', 'hypo:tremor', 'hypo:malaise'], 'A');
    expect(r.level).toBe('level1');
  });
});

describe('computeDiabeteSymptomTriage — hyperglycémie chronique', () => {
  it('≥ 3 chronic hyper signs = level 2', () => {
    const r = triage(['hyper:polydipsia', 'hyper:polyuria', 'hyper:fatigue']);
    expect(r.level).toBe('level2');
    expect(r.reasonCode).toBe('symptom-hyper-chronic-multi');
  });

  it('1-2 chronic hyper signs = level 1', () => {
    expect(triage(['hyper:fatigue']).level).toBe('level1');
    expect(triage(['hyper:fatigue', 'hyper:slow-healing']).level).toBe('level1');
  });
});

describe('computeDiabeteSymptomTriage — priority ordering', () => {
  it('severity wins over acidocétose', () => {
    const r = triage([
      'severity:loss-of-consciousness',
      'acido:kussmaul',
      'acido:nausea',
      'acido:fruity-breath',
    ]);
    expect(r.level).toBe('level3b');
    expect(r.reasonCode).toBe('symptom-severity');
  });

  it('acidocétose triad wins over multiple hypo signs', () => {
    const r = triage(
      ['hypo:sweats', 'hypo:tremor', 'acido:kussmaul', 'acido:nausea', 'acido:fruity-breath'],
      'E',
    );
    expect(r.level).toBe('level3b');
    expect(r.reasonCode).toBe('symptom-acidocetose-severe');
  });

  it('multi-hypo at risk wins over chronic-hyper-multi', () => {
    const r = triage(
      ['hypo:sweats', 'hypo:tremor', 'hyper:polydipsia', 'hyper:polyuria', 'hyper:fatigue'],
      'D',
    );
    expect(r.level).toBe('level3a');
  });
});

describe('computeDiabeteSymptomTriage — sources', () => {
  it('always cites HAS / SFD', () => {
    const r = triage(['hypo:tremor']);
    expect(r.sources.some((s) => /HAS/.test(s))).toBe(true);
  });
});

describe('diabeteSymptomReportSchema', () => {
  const base = {
    pathologyType: 'diabeteT2' as const,
    symptoms: ['hypo:sweats' as const],
    reportedAt: new Date().toISOString(),
  };

  it('accepts a well-formed report', () => {
    expect(diabeteSymptomReportSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an empty symptom list', () => {
    expect(diabeteSymptomReportSchema.safeParse({ ...base, symptoms: [] }).success).toBe(false);
  });

  it('rejects an unknown symptom code', () => {
    expect(diabeteSymptomReportSchema.safeParse({ ...base, symptoms: ['hypo:foo'] }).success).toBe(
      false,
    );
  });

  it('accepts every declared symptom code', () => {
    for (const code of DIABETE_SYMPTOM_CODES) {
      const r = diabeteSymptomReportSchema.safeParse({ ...base, symptoms: [code] });
      expect(r.success).toBe(true);
    }
  });

  it('rejects a future reportedAt', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(diabeteSymptomReportSchema.safeParse({ ...base, reportedAt: future }).success).toBe(
      false,
    );
  });

  it('rejects a note longer than 500 chars', () => {
    expect(diabeteSymptomReportSchema.safeParse({ ...base, note: 'a'.repeat(501) }).success).toBe(
      false,
    );
  });
});
