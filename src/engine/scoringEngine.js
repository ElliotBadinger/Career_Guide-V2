/**
 * Scoring Engine
 * Calculates dimension scores from answers based on question score mappings
 */

import scoringConfig from '../../config/scoring.v1.json';

/**
 * Initialize empty scores object with all dimensions at 0
 * @returns {Object} - Scores object with dimension names as keys
 */
export function initializeScores() {
    const scores = {};
    for (const dimension of Object.keys(scoringConfig.dimensions)) {
        scores[dimension] = {
            total: 0,
            count: 0,
            average: 0
        };
    }
    return scores;
}

/**
 * Calculate all dimension scores from answers
 * @param {Object} answers - User's answers object
 * @param {Object} questionnaire - Full questionnaire config
 * @returns {Object} - Final scores for each dimension (0-100)
 */
export function calculateScores(answers, questionnaire) {
    const scores = initializeScores();

    // Iterate through all sections and questions
    for (const section of questionnaire.sections) {
        for (const question of section.questions) {
            const answer = answers[question.id];

            if (!answer) continue;

            // Handle different question types
            if (question.type === 'single' && question.options) {
                // Find the selected option
                const selectedOption = question.options.find(opt => opt.value === answer);
                if (selectedOption && selectedOption.score) {
                    addScores(scores, selectedOption.score);
                }
            } else if (question.type === 'multi' && question.options && Array.isArray(answer)) {
                // Sum scores from all selected options
                for (const selectedValue of answer) {
                    const selectedOption = question.options.find(opt => opt.value === selectedValue);
                    if (selectedOption && selectedOption.score) {
                        addScores(scores, selectedOption.score);
                    }
                }
            }
        }
    }

    // Calculate averages and normalize to 0-100
    const finalScores = {};
    for (const [dimension, data] of Object.entries(scores)) {
        if (data.count > 0) {
            finalScores[dimension] = Math.round(data.total / data.count);
        } else {
            // Default to middle value if no data
            finalScores[dimension] = 50;
        }
        // Clamp to 0-100
        finalScores[dimension] = Math.max(0, Math.min(100, finalScores[dimension]));
    }

    return finalScores;
}

/**
 * Add score values to running totals
 * @param {Object} scores - Running scores object
 * @param {Object} scoreValues - Score values from an option { dimensionName: value }
 */
function addScores(scores, scoreValues) {
    for (const [dimension, value] of Object.entries(scoreValues)) {
        if (scores[dimension]) {
            scores[dimension].total += value;
            scores[dimension].count += 1;
        }
    }
}

/**
 * Determine the recommended path based on scores
 * @param {Object} scores - Final dimension scores
 * @returns {string} - Recommended path: 'A', 'B', or 'C'
 */
export function determineRecommendation(scores) {
    const { thresholds } = scoringConfig.recommendations;

    // Check Path A conditions
    const pathA = thresholds.A;
    if (pathA.conditions) {
        const meetsA = checkConditions(scores, pathA.conditions);
        if (meetsA) {
            return 'A';
        }
    }

    // Check Path B conditions
    const pathB = thresholds.B;
    if (pathB.conditions) {
        const meetsB = checkConditions(scores, pathB.conditions);
        if (meetsB) {
            return 'B';
        }
    }

    // Default to Path C
    return 'C';
}

/**
 * Check if scores meet condition set
 * @param {Object} scores - Dimension scores
 * @param {Object} conditions - Condition object with min/max thresholds
 * @returns {boolean}
 */
function checkConditions(scores, conditions) {
    // Handle OR conditions
    if (conditions.OR) {
        return conditions.OR.some(cond => checkConditions(scores, cond));
    }

    // Handle default (always true)
    if (conditions.default) {
        return true;
    }

    // Check each dimension condition
    for (const [dimension, thresholds] of Object.entries(conditions)) {
        const score = scores[dimension];
        if (score === undefined) continue;

        if (thresholds.min !== undefined && score < thresholds.min) {
            return false;
        }
        if (thresholds.max !== undefined && score > thresholds.max) {
            return false;
        }
    }

    return true;
}

/**
 * Get applicable modifiers based on scores
 * @param {Object} scores - Dimension scores
 * @returns {Array} - Array of applicable modifier objects
 */
export function getModifiers(scores) {
    const { modifiers } = scoringConfig.recommendations;
    const applicable = [];

    for (const modifier of modifiers) {
        if (checkConditions(scores, modifier.condition)) {
            applicable.push(modifier);
        }
    }

    return applicable;
}

/**
 * Get top drivers (reasons) for the recommendation
 * @param {Object} scores - Dimension scores
 * @returns {Array} - Array of driver keys that apply
 */
export function getDrivers(scores) {
    const { driverTemplates, maxDrivers } = scoringConfig.drivers;
    const applicable = [];

    for (const [key, driver] of Object.entries(driverTemplates)) {
        if (checkConditions(scores, driver.condition)) {
            applicable.push(key);
        }
    }

    return applicable.slice(0, maxDrivers);
}

/**
 * Full scoring result object
 * @param {Object} answers - User answers
 * @param {Object} questionnaire - Questionnaire config
 * @returns {Object} - Complete scoring result
 */
export function generateScoringResult(answers, questionnaire) {
    const scores = calculateScores(answers, questionnaire);
    const recommendation = determineRecommendation(scores);
    const modifiers = getModifiers(scores);
    const drivers = getDrivers(scores);

    return {
        scores,
        recommendation,
        modifiers,
        drivers,
        generatedAt: new Date().toISOString()
    };
}
