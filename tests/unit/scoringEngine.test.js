import { describe, it, expect } from 'vitest';
import {
    calculateScores,
    determineRecommendation,
    getModifiers,
    getDrivers,
    generateScoringResult
} from '../../src/engine/scoringEngine';

describe('scoringEngine', () => {
    it('calculates scores from single and multi selections', () => {
        const questionnaire = {
            sections: [
                {
                    questions: [
                        {
                            id: 'attendance',
                            type: 'single',
                            options: [
                                { value: 'always', score: { academicReadiness: 100 } },
                                { value: 'rarely', score: { academicReadiness: 20 } }
                            ]
                        },
                        {
                            id: 'strengths',
                            type: 'multi',
                            options: [
                                { value: 'hands', score: { practicalPreference: 20 } },
                                { value: 'people', score: { practicalPreference: 40 } }
                            ]
                        }
                    ]
                }
            ]
        };

        const scores = calculateScores(
            { attendance: 'always', strengths: ['hands', 'people'] },
            questionnaire
        );

        expect(scores.academicReadiness).toBe(100);
        expect(scores.practicalPreference).toBe(30);
        expect(scores.supportNeed).toBe(50);
        expect(scores.constraintLoad).toBe(50);
        expect(scores.wellbeingFlag).toBe(50);
    });

    it('determines recommendations and modifiers', () => {
        const pathA = determineRecommendation({
            academicReadiness: 60,
            constraintLoad: 40,
            practicalPreference: 40,
            supportNeed: 40,
            wellbeingFlag: 40
        });
        expect(pathA).toBe('A');

        const pathB = determineRecommendation({
            academicReadiness: 35,
            constraintLoad: 40,
            practicalPreference: 70,
            supportNeed: 40,
            wellbeingFlag: 40
        });
        expect(pathB).toBe('B');

        const pathC = determineRecommendation({
            academicReadiness: 50,
            constraintLoad: 55,
            practicalPreference: 45,
            supportNeed: 40,
            wellbeingFlag: 40
        });
        expect(pathC).toBe('C');

        const modifiers = getModifiers({
            academicReadiness: 40,
            constraintLoad: 80,
            practicalPreference: 50,
            supportNeed: 70,
            wellbeingFlag: 60
        });
        expect(modifiers.map((mod) => mod.emphasis)).toEqual(
            expect.arrayContaining(['structured_support', 'wellbeing_resources', 'flexible_options'])
        );
    });

    it('returns drivers and scoring result payload', () => {
        const drivers = getDrivers({
            academicReadiness: 30,
            constraintLoad: 70,
            practicalPreference: 80,
            supportNeed: 70,
            wellbeingFlag: 60
        });
        expect(drivers.length).toBeGreaterThan(0);
        expect(drivers.length).toBeLessThanOrEqual(3);

        const result = generateScoringResult(
            { attendance: 'always' },
            { sections: [{ questions: [] }] }
        );
        expect(result).toHaveProperty('scores');
        expect(result).toHaveProperty('recommendation');
        expect(result).toHaveProperty('modifiers');
        expect(result).toHaveProperty('drivers');
        expect(result).toHaveProperty('generatedAt');
    });
});
