import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'career_guide_v1_progress';

const getInitialState = () => ({
    version: '1.0.0',
    startedAt: null,
    lastUpdatedAt: null,
    currentStep: 0,
    answers: {},
    scores: null,
    completed: false
});

export function useAutosave() {
    const [state, setState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Check version compatibility
                if (parsed.version === '1.0.0') {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load saved progress:', e);
        }
        return getInitialState();
    });

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (state.startedAt) {
            const toSave = {
                ...state,
                lastUpdatedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
    }, [state]);

    const setAnswer = useCallback((questionId, value) => {
        setState(prev => ({
            ...prev,
            startedAt: prev.startedAt || new Date().toISOString(),
            answers: {
                ...prev.answers,
                [questionId]: value
            }
        }));
    }, []);

    const setCurrentStep = useCallback((step) => {
        setState(prev => ({
            ...prev,
            currentStep: step
        }));
    }, []);

    const setScores = useCallback((scores) => {
        setState(prev => ({
            ...prev,
            scores
        }));
    }, []);

    const setCompleted = useCallback((completed) => {
        setState(prev => ({
            ...prev,
            completed
        }));
    }, []);

    const resetProgress = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setState(getInitialState());
    }, []);

    const hasProgress = state.startedAt !== null && state.currentStep > 0;

    return {
        state,
        answers: state.answers,
        currentStep: state.currentStep,
        scores: state.scores,
        completed: state.completed,
        hasProgress,
        setAnswer,
        setCurrentStep,
        setScores,
        setCompleted,
        resetProgress
    };
}

// Export the storage key for external use (e.g., JSON download)
export { STORAGE_KEY };
