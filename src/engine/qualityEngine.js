/**
 * Quality Engine
 * Analyzes submission data for quality indicators and potential gaming
 */

import { calculateScores } from './scoringEngine';

/**
 * Calculate data quality metrics and risk assessment
 * @param {Object} answers - User answers
 * @param {Object} questionnaire - Questionnaire config
 * @param {Object} metadata - Submission metadata (completion time, etc.)
 * @returns {Object} - Data quality assessment object
 */
export function assessDataQuality(answers, questionnaire, metadata) {
    const contradictions = checkContradictions(answers);
    const straightLining = checkStraightLining(answers, questionnaire);
    const perfectProfile = checkPerfectProfile(answers, questionnaire);
    const speeding = checkSpeeding(metadata.completion_duration_seconds, questionnaire.totalQuestions);
    const attention = checkAttention(answers, questionnaire);
    
    const metrics = {
        completion_seconds: metadata.completion_duration_seconds,
        attention_passed: attention.passed,
        contradiction_count: contradictions.length,
        straightline_score: straightLining.score
    };

    let risk = 'low';
    const reasons = [];
    const riskOrder = { low: 0, medium: 1, high: 2 };

    const bumpRisk = (level) => {
        if (riskOrder[level] > riskOrder[risk]) {
            risk = level;
        }
    };

    const addReason = (reason) => {
        if (!reasons.includes(reason)) {
            reasons.push(reason);
        }
    };

    if (speeding.isSpeeding) {
        bumpRisk('high');
        addReason('speeding');
    }

    if (attention.passed === false) {
        bumpRisk('high');
        addReason('attention_check_failed');
    }

    if (contradictions.length > 0) {
        bumpRisk(contradictions.length >= 2 ? 'high' : 'medium');
        addReason('contradictions');
    }

    if (straightLining.isSuspicious) {
        bumpRisk(speeding.isSpeeding ? 'high' : 'medium');
        addReason('straight_lining');
    }

    if (perfectProfile.isPerfect) {
        bumpRisk('medium');
        addReason('perfect_profile');
    }

    return {
        risk,
        reasons,
        metrics
    };
}

/**
 * Check for logical contradictions in answers
 * @param {Object} answers 
 * @returns {Array} List of contradiction codes
 */
function checkContradictions(answers) {
    const found = [];

    // Contradiction 1: Attendance
    // "Always" attend school BUT "Attendance" is a blocker
    if (answers.attendance === 'always' && 
        Array.isArray(answers.schoolBlockers) && 
        answers.schoolBlockers.includes('attendance')) {
        found.push('attendance_mismatch');
    }

    // Contradiction 2: Academic Performance
    // Marks > 70% BUT Understanding is a blocker
    if (answers.marksRange === 'above70' && 
        Array.isArray(answers.schoolBlockers) && 
        answers.schoolBlockers.includes('understanding')) {
        found.push('performance_mismatch');
    }

    // Contradiction 3: Financial
    // Financial situation "Okay" BUT Financial blocker
    if (answers.financialSituation === 'okay' && 
        getConstraintFlags(answers).includes('financial')) {
        // Note: getConstraintFlags logic needs to be consistent. 
        // Here we do a direct check on the derived flag logic if possible, 
        // but since we only have answers, we check if they selected "noResources" maybe?
        if (Array.isArray(answers.schoolBlockers) && answers.schoolBlockers.includes('noResources')) {
             found.push('financial_mismatch');
        }
    }

    return found;
}

/**
 * Check if user is just clicking the same position option repeatedly
 * @param {Object} answers 
 * @param {Object} questionnaire 
 */
function isAttentionCheck(question) {
    return Boolean(question && question.attentionCheck);
}

function checkStraightLining(answers, questionnaire) {
    let totalSingleChoice = 0;
    let positionCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let maxPosition = 0;

    for (const section of questionnaire.sections) {
        for (const question of section.questions) {
            if (question.type === 'single' && question.options && !isAttentionCheck(question)) {
                const answer = answers[question.id];
                if (!answer) continue;

                const index = question.options.findIndex(opt => opt.value === answer);
                if (index !== -1 && index <= 4) { // Only track first 5 positions
                    positionCounts[index]++;
                    totalSingleChoice++;
                    if (index > maxPosition) maxPosition = index;
                }
            }
        }
    }

    if (totalSingleChoice < 5) return { isSuspicious: false, score: 0 };

    // Calculate max frequency
    const maxFreq = Math.max(...Object.values(positionCounts));
    const ratio = maxFreq / totalSingleChoice;

    // If more than 80% of answers are in the same position
    return {
        isSuspicious: ratio > 0.8,
        score: Math.round(ratio * 100),
        dominant_position: Object.keys(positionCounts).find(key => positionCounts[key] === maxFreq)
    };
}

/**
 * Check attention items for expected answers
 * @param {Object} answers
 * @param {Object} questionnaire
 * @returns {{passed: boolean|null}}
 */
function checkAttention(answers, questionnaire) {
    const checks = [];

    for (const section of questionnaire.sections) {
        for (const question of section.questions) {
            if (!isAttentionCheck(question)) continue;

            if (typeof question.attentionCheck === 'string') {
                checks.push({ id: question.id, expected: question.attentionCheck, required: question.required });
                continue;
            }

            if (question.attentionCheck && question.attentionCheck.expected) {
                checks.push({
                    id: question.id,
                    expected: question.attentionCheck.expected,
                    required: question.required
                });
            }
        }
    }

    if (checks.length === 0) {
        return { passed: null };
    }

    let answered = 0;
    let failed = 0;
    let requiredMissing = false;

    for (const check of checks) {
        const answer = answers[check.id];
        if (answer === undefined || answer === null || answer === '') {
            if (check.required) requiredMissing = true;
            continue;
        }

        answered++;
        if (answer !== check.expected) failed++;
    }

    if (requiredMissing) return { passed: false };
    if (answered === 0) return { passed: null };

    return { passed: failed === 0 };
}

/**
 * Check if the profile scores are "perfect" (all 100s)
 * @param {Object} answers 
 * @param {Object} questionnaire 
 */
function checkPerfectProfile(answers, questionnaire) {
    const scores = calculateScores(answers, questionnaire);
    
    // Actually, "perfect" might mean high academic readiness and low support need
    // Let's check if Academic Readiness is 100
    
    const isPerfect = scores.academicReadiness === 100 && scores.supportNeed === 0;

    return {
        isPerfect,
        scores
    };
}

/**
 * Check for speeding
 * @param {number} durationSeconds 
 * @param {number} totalQuestions 
 */
function checkSpeeding(durationSeconds, totalQuestions) {
    if (!durationSeconds) return { isSpeeding: false };

    // Threshold: e.g., less than 3 seconds per question on average
    const threshold = totalQuestions * 3; 
    
    return {
        isSpeeding: durationSeconds < threshold,
        threshold
    };
}

/**
 * Helper to replicate the logic from submissionUtils for consistency 
 * (or we could export it from there, but circular deps might be an issue)
 */
function getConstraintFlags(answers) {
    const flags = [];
    if (answers.transportAccess === 'difficult' || answers.transportAccess === 'veryDifficult') flags.push('transport');
    if (answers.financialSituation === 'difficult') flags.push('financial');
    return flags;
}
