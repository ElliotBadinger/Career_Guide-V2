import { useState, useEffect, useCallback } from 'react';
import { I18nProvider, useI18n, LanguageToggle } from './hooks/useI18n';
import { useAutosave } from './hooks/useAutosave';
import { getFlatVisibleQuestions, isQuestionAnswered } from './engine/branchingEngine';
import { ConsentScreen } from './components/ConsentScreen';
import { QuestionRenderer, WellbeingNotice } from './components/QuestionRenderer';
import { ProgressBar } from './components/ProgressBar';
import { NavigationButtons } from './components/NavigationButtons';
import { SubmissionConfirmationScreen } from './components/SubmissionConfirmationScreen';
import { SubmissionConsentCheckbox } from './components/SubmissionConsentCheckbox';
import {
  generateSubmissionPayload,
  submitPayload,
  queueSubmission,
  hasPendingSubmissions,
  retryQueuedSubmissions
} from './utils/submissionUtils';
import questionnaire from '../config/questionnaire.v1.json';
import './index.css';

function AppContent() {
  const { t, language } = useI18n();
  const {
    answers,
    currentStep,
    completed,
    hasProgress,
    setAnswer,
    setCurrentStep,
    setCompleted,
    resetProgress,
    state
  } = useAutosave();

  const [showConsent, setShowConsent] = useState(!answers.consent_agree);
  const [showResume, setShowResume] = useState(false);
  const [submissionConsent, setSubmissionConsent] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // null | 'pending' | 'success' | 'failed'
  const [submissionPayload, setSubmissionPayload] = useState(null);

  // Get visible questions based on current answers
  const visibleQuestions = getFlatVisibleQuestions(questionnaire.sections.slice(1), answers);
  const totalQuestions = visibleQuestions.length;
  const currentQuestion = visibleQuestions[currentStep];

  // Check for saved progress on mount
  useEffect(() => {
    if (hasProgress && !completed && answers.consent_agree) {
      setShowResume(true);
    }
  }, []);

  // Handle submission when questionnaire is completed
  useEffect(() => {
    if (completed && !submissionPayload && submissionConsent) {
      handleSubmit();
    }
  }, [completed, submissionPayload, submissionConsent]);

  // Handle consent
  const handleConsentAgree = () => {
    setAnswer('consent_agree', true);
    setShowConsent(false);
    setShowResume(false);
  };

  const handleConsentDisagree = () => {
    alert(t('consent.disagree'));
  };

  // Handle resume prompt
  const handleResume = () => {
    setShowResume(false);
    setShowConsent(false);
  };

  const handleStartFresh = () => {
    resetProgress();
    setShowResume(false);
    setShowConsent(true);
    setSubmissionPayload(null);
    setSubmissionStatus(null);
    setSubmissionConsent(false);
  };

  // Navigation
  const handleNext = () => {
    if (!currentQuestion) return;

    // Validate required question
    if (!isQuestionAnswered(currentQuestion.question, answers)) {
      alert(t('errors.required'));
      return;
    }

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark questionnaire as complete (submission happens after consent)
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submission handler
  const handleSubmit = async () => {
    setSubmissionStatus('pending');

    // Generate payload
    const payload = generateSubmissionPayload(
      answers,
      questionnaire,
      language,
      state.startedAt
    );
    setSubmissionPayload(payload);

    // Attempt submission
    const result = await submitPayload(payload);

    if (result.success) {
      setSubmissionStatus('success');
    } else {
      // Queue for retry
      queueSubmission(payload);
      setSubmissionStatus('failed');
    }
  };

  // Retry handler
  const handleRetry = async () => {
    setSubmissionStatus('pending');

    if (submissionPayload) {
      const result = await submitPayload(submissionPayload);
      if (result.success) {
        setSubmissionStatus('success');
      } else {
        setSubmissionStatus('failed');
      }
    } else {
      // Retry queued submissions
      const result = await retryQueuedSubmissions();
      if (result.succeeded > 0) {
        setSubmissionStatus('success');
      } else {
        setSubmissionStatus('failed');
      }
    }
  };

  // Download JSON handler
  const handleDownloadJson = () => {
    if (!submissionPayload) return;

    const blob = new Blob([JSON.stringify(submissionPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${submissionPayload.submission_id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Show consent screen
  if (showConsent) {
    return (
      <ConsentScreen
        onAgree={handleConsentAgree}
        onDisagree={handleConsentDisagree}
      />
    );
  }

  // Show resume prompt
  if (showResume) {
    return (
      <div className="app-container">
        <div className="orb-bottom" />
        <header className="space-y-4">
          <span className="pill">🧭 {t('app.pill')}</span>
          <h1 className="font-display text-3xl text-gray-800">{t('app.title')}</h1>
        </header>
        <div className="flex justify-end mt-4">
          <LanguageToggle />
        </div>

        <section className="mt-8 glass-card fade-in text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="font-display text-2xl text-gray-800 mb-4">{t('nav.resume')}</h2>
          <p className="text-sm uppercase tracking-widest text-gray-500 mb-6">
            Step {currentStep + 1} of {totalQuestions}
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleResume}
            >
              {t('nav.resume')} →
            </button>
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={handleStartFresh}
            >
              {t('nav.startFresh')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Show submission confirmation screen
  if (completed && submissionConsent) {
    return (
      <div className="app-container">
        <div className="orb-bottom" />
        <header className="space-y-4">
          <span className="pill">✅ {t('submission.title')}</span>
          <h1 className="font-display text-3xl text-gray-800">{t('app.title')}</h1>
        </header>
        <div className="flex justify-end mt-4">
          <LanguageToggle />
        </div>

        <div className="mt-6">
          <SubmissionConfirmationScreen
            payload={submissionPayload}
            submissionStatus={submissionStatus}
            onRetry={handleRetry}
            onStartFresh={handleStartFresh}
            onDownloadJson={handleDownloadJson}
          />
        </div>
      </div>
    );
  }

  // Show submission consent screen (after completing all questions)
  if (completed && !submissionConsent) {
    return (
      <div className="app-container">
        <div className="orb-bottom" />
        <header className="space-y-4">
          <span className="pill">📝 {t('submission.confirmTitle') || 'Confirm Submission'}</span>
          <h1 className="font-display text-3xl text-gray-800">{t('app.title')}</h1>
        </header>
        <div className="flex justify-end mt-4">
          <LanguageToggle />
        </div>

        <section className="mt-8 glass-card fade-in">
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">📬</span>
            <h2 className="font-display text-2xl text-gray-800 mb-4">
              {t('submission.readyTitle') || 'Ready to Submit'}
            </h2>
            <p className="text-gray-600">
              {t('submission.readyMessage') || 'You have answered all the questions. Your answers will be sent for review.'}
            </p>
          </div>

          <SubmissionConsentCheckbox
            checked={submissionConsent}
            onChange={setSubmissionConsent}
          />

          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!submissionConsent}
              onClick={handleSubmit}
            >
              ✉️ {t('submission.submit') || 'Submit Answers'}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => {
                setCompleted(false);
                setCurrentStep(totalQuestions - 1);
              }}
            >
              ← {t('nav.back')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Show questionnaire
  if (!currentQuestion) {
    return (
      <div className="app-container">
        <p>{t('errors.configLoad')}</p>
      </div>
    );
  }

  const { section, question } = currentQuestion;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalQuestions - 1;
  const canGoNext = isQuestionAnswered(question, answers);

  return (
    <div className="app-container">
      <div className="orb-bottom" />
      <header className="flex justify-between items-center mb-4">
        <h1 className="font-display text-xl text-gray-800">{t('app.title')}</h1>
        <LanguageToggle />
      </header>

      <ProgressBar current={currentStep} total={totalQuestions} />

      <section className="glass-card fade-in">
        {/* Section title (if different from previous) */}
        {(isFirst || visibleQuestions[currentStep - 1]?.section.id !== section.id) && (
          <p className="text-xs uppercase tracking-widest text-teal font-medium mb-4">
            {section.title}
          </p>
        )}

        <QuestionRenderer
          question={question}
          value={answers[question.id]}
          onChange={(value) => setAnswer(question.id, value)}
        />

        {/* Wellbeing support note */}
        {section.showSupportNote && isLast && (
          <WellbeingNotice message={section.supportNoteKey} />
        )}

        <NavigationButtons
          onNext={handleNext}
          onBack={handleBack}
          canGoBack={!isFirst}
          canGoNext={canGoNext}
          isFirst={isFirst}
          isLast={isLast}
        />
      </section>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
