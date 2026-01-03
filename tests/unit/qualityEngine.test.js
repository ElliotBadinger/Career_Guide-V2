import { describe, it, expect } from 'vitest';
import { assessDataQuality } from '../../src/engine/qualityEngine';

const questionnaire = {
    totalQuestions: 6,
    sections: [
        {
            questions: [
                {
                    id: 'attentionCheck',
                    type: 'single',
                    attentionCheck: { expected: 'sometimes' },
                    options: [
                        { value: 'rarely' },
                        { value: 'sometimes' },
                        { value: 'often' }
                    ]
                },
                {
                    id: 'q1',
                    type: 'single',
                    options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
                },
                {
                    id: 'q2',
                    type: 'single',
                    options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
                },
                {
                    id: 'q3',
                    type: 'single',
                    options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
                },
                {
                    id: 'q4',
                    type: 'single',
                    options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
                },
                {
                    id: 'q5',
                    type: 'single',
                    options: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
                }
            ]
        }
    ]
};

describe('qualityEngine', () => {
    it('returns low risk with clean answers', () => {
        const dataQuality = assessDataQuality(
            {
                attentionCheck: 'sometimes',
                q1: 'a',
                q2: 'b',
                q3: 'c',
                q4: 'a'
            },
            questionnaire,
            { completion_duration_seconds: 30 }
        );

        expect(dataQuality.risk).toBe('low');
        expect(dataQuality.reasons).toEqual([]);
        expect(dataQuality.metrics.attention_passed).toBe(true);
        expect(dataQuality.metrics.contradiction_count).toBe(0);
    });

    it('flags speeding, attention, contradictions, and straight-lining', () => {
        const dataQuality = assessDataQuality(
            {
                attentionCheck: 'rarely',
                q1: 'a',
                q2: 'a',
                q3: 'a',
                q4: 'a',
                q5: 'a',
                attendance: 'always',
                marksRange: 'above70',
                schoolBlockers: ['attendance', 'understanding'],
                financialSituation: 'okay'
            },
            questionnaire,
            { completion_duration_seconds: 2 }
        );

        expect(dataQuality.risk).toBe('high');
        expect(dataQuality.reasons).toEqual(
            expect.arrayContaining(['speeding', 'attention_check_failed', 'contradictions', 'straight_lining'])
        );
        expect(dataQuality.metrics.contradiction_count).toBeGreaterThan(0);
        expect(dataQuality.metrics.attention_passed).toBe(false);
    });
});
