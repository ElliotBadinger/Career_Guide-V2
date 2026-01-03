/**
 * Branching Engine
 * Evaluates showIf conditions to determine which questions to display
 */

/**
 * Check if a question should be shown based on current answers
 * @param {Object} question - Question config with optional showIf
 * @param {Object} answers - Current answers object
 * @returns {boolean} - Whether to show the question
 */
export function shouldShowQuestion(question, answers) {
    if (!question.showIf) {
        return true;
    }

    const { showIf } = question;

    // showIf is an object like: { "marksRange": ["30to50", "below30"] }
    // Question shows if ALL conditions are met
    for (const [questionId, allowedValues] of Object.entries(showIf)) {
        const currentAnswer = answers[questionId];

        if (!currentAnswer) {
            return false; // Required answer not yet given
        }

        // If allowedValues is an array, check if current answer is in it
        if (Array.isArray(allowedValues)) {
            if (!allowedValues.includes(currentAnswer)) {
                return false;
            }
        } else {
            // Direct value comparison
            if (currentAnswer !== allowedValues) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Get all visible questions from a section based on current answers
 * @param {Object} section - Section config with questions array
 * @param {Object} answers - Current answers object
 * @returns {Array} - Array of visible questions
 */
export function getVisibleQuestions(section, answers) {
    return section.questions.filter(q => shouldShowQuestion(q, answers));
}

/**
 * Flatten all sections into a single array of visible questions
 * @param {Array} sections - Array of section configs
 * @param {Object} answers - Current answers object
 * @returns {Array} - Flat array of {section, question} objects
 */
export function getFlatVisibleQuestions(sections, answers) {
    const result = [];

    for (const section of sections) {
        const visibleQuestions = getVisibleQuestions(section, answers);
        for (const question of visibleQuestions) {
            result.push({
                section,
                question
            });
        }
    }

    return result;
}

/**
 * Calculate total progress percentage
 * @param {number} currentIndex - Current question index (0-based)
 * @param {number} totalQuestions - Total number of visible questions
 * @returns {number} - Percentage (0-100)
 */
export function calculateProgress(currentIndex, totalQuestions) {
    if (totalQuestions === 0) return 0;
    return Math.round((currentIndex / totalQuestions) * 100);
}

/**
 * Check if a required question has been answered
 * @param {Object} question - Question config
 * @param {Object} answers - Current answers object
 * @returns {boolean} - Whether question is answered (or not required)
 */
export function isQuestionAnswered(question, answers) {
    if (!question.required) {
        return true;
    }

    const answer = answers[question.id];

    if (answer === undefined || answer === null) {
        return false;
    }

    // For multi-select, check if at least one is selected
    if (question.type === 'multi' && Array.isArray(answer)) {
        return answer.length > 0;
    }

    // For text/textarea, check if not empty
    if (question.type === 'text' || question.type === 'textarea') {
        return answer.trim().length > 0;
    }

    // For consent, must be true
    if (question.type === 'consent') {
        return answer === true;
    }

    return true;
}
