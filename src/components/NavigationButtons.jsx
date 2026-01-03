import { useI18n } from '../hooks/useI18n';

export function NavigationButtons({
    onNext,
    onBack,
    canGoBack = true,
    canGoNext = true,
    isFirst = false,
    isLast = false,
    isConsent = false
}) {
    const { t } = useI18n();

    return (
        <div className="flex gap-3 mt-8">
            {canGoBack && !isFirst && (
                <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={onBack}
                >
                    ← {t('nav.back')}
                </button>
            )}

            <button
                type="button"
                className={`btn btn-primary ${isFirst && !canGoBack ? 'w-full' : 'flex-1'}`}
                onClick={onNext}
                disabled={!canGoNext}
            >
                {isConsent ? t('nav.start') : isLast ? t('nav.finish') : t('nav.next')} →
            </button>
        </div>
    );
}
