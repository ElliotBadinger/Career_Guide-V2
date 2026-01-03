import { describe, it, expect } from 'vitest';
import {
    shouldShowQuestion,
    getVisibleQuestions,
    getFlatVisibleQuestions,
    calculateProgress,
    isQuestionAnswered
} from '../../src/engine/branchingEngine';

describe('branchingEngine', () => {
    it('respects showIf conditions', () => {
        const question = {
            id: 'schoolBlockers',
            showIf: { marksRange: ['30to50', 'below30'] }
        };

        expect(shouldShowQuestion(question, { marksRange: '30to50' })).toBe(true);
        expect(shouldShowQuestion(question, { marksRange: 'above70' })).toBe(false);
        expect(shouldShowQuestion(question, {})).toBe(false);
    });

    it('filters visible questions and flattens sections', () => {
        const sections = [
            {
                id: 'one',
                questions: [
                    { id: 'q1' },
                    { id: 'q2', showIf: { q1: 'yes' } }
                ]
            },
            {
                id: 'two',
                questions: [{ id: 'q3' }]
            }
        ];

        const visible = getVisibleQuestions(sections[0], { q1: 'yes' });
        expect(visible.map((q) => q.id)).toEqual(['q1', 'q2']);

        const flat = getFlatVisibleQuestions(sections, { q1: 'yes' });
        expect(flat.map((entry) => entry.question.id)).toEqual(['q1', 'q2', 'q3']);
    });

    it('calculates progress and answer completion', () => {
        expect(calculateProgress(0, 0)).toBe(0);
        expect(calculateProgress(1, 4)).toBe(25);

        expect(isQuestionAnswered({ id: 'q1', required: false }, {})).toBe(true);
        expect(isQuestionAnswered({ id: 'q2', required: true }, {})).toBe(false);
        expect(isQuestionAnswered({ id: 'q3', required: true, type: 'multi' }, { q3: [] })).toBe(false);
        expect(isQuestionAnswered({ id: 'q4', required: true, type: 'multi' }, { q4: ['a'] })).toBe(true);
        expect(isQuestionAnswered({ id: 'q5', required: true, type: 'text' }, { q5: ' ' })).toBe(false);
        expect(isQuestionAnswered({ id: 'q6', required: true, type: 'textarea' }, { q6: 'ok' })).toBe(true);
        expect(isQuestionAnswered({ id: 'q7', required: true, type: 'consent' }, { q7: true })).toBe(true);
        expect(isQuestionAnswered({ id: 'q8', required: true, type: 'consent' }, { q8: false })).toBe(false);
    });
});
