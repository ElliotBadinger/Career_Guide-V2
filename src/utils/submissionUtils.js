/**
 * Submission Utilities
 * Handle payload generation, submission, and queue/retry logic
 */

import { calculateScores } from '../engine/scoringEngine';
import { assessDataQuality } from '../engine/qualityEngine';

const QUEUE_KEY = 'career_guide_submission_queue';
const SUBMIT_ENDPOINT = import.meta.env.VITE_SUBMIT_ENDPOINT || '/.netlify/functions/submit';

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Categorize attendance into bands for derived_fields
 * @param {string} attendance - Raw attendance answer
 * @returns {string} - Band: 'high', 'medium', 'low'
 */
function getAttendanceBand(attendance) {
    const mapping = {
        always: 'high',
        often: 'high',
        sometimes: 'medium',
        rarely: 'low',
        notInSchool: 'low'
    };
    return mapping[attendance] || 'unknown';
}

/**
 * Categorize practical preference into bands
 * @param {number} practicalScore - Score from scoring engine
 * @returns {string} - Band: 'high', 'medium', 'low'
 */
function getPracticalPreferenceBand(practicalScore) {
    if (practicalScore >= 60) return 'high';
    if (practicalScore >= 40) return 'medium';
    return 'low';
}

/**
 * Extract constraint flags from answers
 * @param {Object} answers - User answers
 * @returns {string[]} - Array of constraint flags
 */
function getConstraintFlags(answers) {
    const flags = [];

    if (answers.transportAccess === 'difficult' || answers.transportAccess === 'veryDifficult') {
        flags.push('transport');
    }
    if (answers.financialSituation === 'difficult') {
        flags.push('financial');
    }
    if (answers.homeResponsibilities === 'many' || answers.homeResponsibilities === 'caring') {
        flags.push('home_responsibilities');
    }
    if (answers.deviceAccess === 'no') {
        flags.push('no_device');
    }
    if (answers.safety === 'no') {
        flags.push('safety_concern');
    }

    return flags;
}

/**
 * Identify free text fields from answers
 * @param {Object} answers - User answers
 * @param {Object} questionnaire - Questionnaire config
 * @returns {Object} - Object with free text field IDs and values
 */
function extractFreeTextFields(answers, questionnaire) {
    const freeText = {};

    for (const section of questionnaire.sections) {
        for (const question of section.questions) {
            if (question.type === 'text' && answers[question.id]) {
                freeText[question.id] = answers[question.id];
            }
        }
    }

    return freeText;
}

/**
 * Generate the canonical submission payload
 * @param {Object} answers - User answers
 * @param {Object} questionnaire - Questionnaire config  
 * @param {string} language - Language code (en/zu)
 * @param {string} startedAt - ISO timestamp when questionnaire started
 * @returns {Object} - Canonical payload
 */
export function generateSubmissionPayload(answers, questionnaire, language, startedAt) {
    const submissionId = generateUUID();
    const createdAt = new Date().toISOString();

    // Calculate scores for derived_fields (NOT for display)
    const scores = calculateScores(answers, questionnaire);

    // Extract free text fields
    const freeTextFields = extractFreeTextFields(answers, questionnaire);

    // Build answers object (excluding free text which goes in separate field)
    const answersWithoutFreeText = { ...answers };
    for (const key of Object.keys(freeTextFields)) {
        delete answersWithoutFreeText[key];
    }
    // Also remove consent field as it's not a questionnaire answer
    delete answersWithoutFreeText.consent_agree;

    // Calculate completion duration
    let completionDurationSeconds = null;
    if (startedAt) {
        const startTime = new Date(startedAt).getTime();
        const endTime = new Date().getTime();
        completionDurationSeconds = Math.round((endTime - startTime) / 1000);
    }

    const metadata = {
        completion_duration_seconds: completionDurationSeconds,
        device_locale: navigator.language || 'unknown'
    };

    const dataQuality = assessDataQuality(answers, questionnaire, metadata);

    return {
        submission_id: submissionId,
        created_at: createdAt,
        questionnaire_version: questionnaire.version || '1.0.0',
        language_used: language,
        answers: answersWithoutFreeText,
        free_text_fields: Object.keys(freeTextFields).length > 0 ? freeTextFields : undefined,
        derived_fields: {
            attendance_band: getAttendanceBand(answers.attendance),
            practical_preference_band: getPracticalPreferenceBand(scores.practicalPreference || 50),
            constraint_flags: getConstraintFlags(answers)
        },
        data_quality: dataQuality,
        metadata: metadata
    };
}

/**
 * Submit payload to serverless endpoint
 * @param {Object} payload - Submission payload
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitPayload(payload) {
    try {
        const response = await fetch(SUBMIT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `Server error: ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            submission_id: data.submission_id
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Network error'
        };
    }
}

/**
 * Queue a submission for later retry
 * @param {Object} payload - Submission payload
 */
export function queueSubmission(payload) {
    const queue = getQueuedSubmissions();

    // Check for duplicates using submission_id
    const exists = queue.some(item => item.submission_id === payload.submission_id);
    if (!exists) {
        queue.push({
            ...payload,
            queued_at: new Date().toISOString(),
            retry_count: 0
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
}

/**
 * Get all queued submissions
 * @returns {Array} - Array of queued payloads
 */
export function getQueuedSubmissions() {
    try {
        const stored = localStorage.getItem(QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Remove a submission from the queue
 * @param {string} submissionId - Submission ID to remove
 */
export function removeFromQueue(submissionId) {
    const queue = getQueuedSubmissions();
    const filtered = queue.filter(item => item.submission_id !== submissionId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Retry all queued submissions
 * @returns {Promise<{succeeded: number, failed: number}>}
 */
export async function retryQueuedSubmissions() {
    const queue = getQueuedSubmissions();
    let succeeded = 0;
    let failed = 0;

    for (const item of queue) {
        // Remove queue metadata before sending
        const { queued_at: _queued_at, retry_count: _retry_count, ...payload } = item;

        const result = await submitPayload(payload);

        if (result.success) {
            removeFromQueue(payload.submission_id);
            succeeded++;
        } else {
            // Update retry count
            const updatedQueue = getQueuedSubmissions().map(q => {
                if (q.submission_id === payload.submission_id) {
                    return { ...q, retry_count: (q.retry_count || 0) + 1 };
                }
                return q;
            });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
            failed++;
        }
    }

    return { succeeded, failed };
}

/**
 * Check if there are pending submissions in queue
 * @returns {boolean}
 */
export function hasPendingSubmissions() {
    return getQueuedSubmissions().length > 0;
}
