import { describe, it, expect, beforeEach } from 'vitest';
import { generateSubmissionPayload } from '../../src/utils/submissionUtils';

describe('submissionUtils', () => {
    beforeEach(() => {
        Object.defineProperty(global.navigator, 'language', {
            value: 'en-US',
            configurable: true
        });
    });

    it('builds payload with derived fields and data quality', () => {
        const questionnaire = {
            version: '1.2.0',
            totalQuestions: 4,
            sections: [
                {
                    questions: [
                        { id: 'name', type: 'text' },
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
                            id: 'goal',
                            type: 'single',
                            options: [{ value: 'a', score: { practicalPreference: 80 } }]
                        }
                    ]
                }
            ]
        };

        const answers = {
            name: 'Ava',
            consent_agree: true,
            attentionCheck: 'sometimes',
            goal: 'a',
            attendance: 'always',
            transportAccess: 'difficult',
            financialSituation: 'difficult',
            homeResponsibilities: 'many',
            deviceAccess: 'no',
            safety: 'no'
        };

        const startedAt = new Date(Date.now() - 20000).toISOString();
        const payload = generateSubmissionPayload(answers, questionnaire, 'en', startedAt);

        expect(payload.submission_id).toBeTruthy();
        expect(payload.language_used).toBe('en');
        expect(payload.answers).not.toHaveProperty('name');
        expect(payload.answers).not.toHaveProperty('consent_agree');
        expect(payload.free_text_fields).toEqual({ name: 'Ava' });
        expect(payload.derived_fields.attendance_band).toBe('high');
        expect(payload.derived_fields.practical_preference_band).toBe('high');
        expect(payload.derived_fields.constraint_flags).toEqual(
            expect.arrayContaining(['transport', 'financial', 'home_responsibilities', 'no_device', 'safety_concern'])
        );
        expect(payload.data_quality).toHaveProperty('risk');
        expect(payload.data_quality.metrics).toEqual(
            expect.objectContaining({
                completion_seconds: expect.any(Number),
                attention_passed: true,
                contradiction_count: 0,
                straightline_score: 0
            })
        );
        expect(payload.metadata.device_locale).toBe('en-US');
    });
});
