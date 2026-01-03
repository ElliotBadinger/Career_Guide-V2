import { useI18n, LanguageToggle } from '../hooks/useI18n';

export function ConsentScreen({ onAgree, onDisagree }) {
    const { t } = useI18n();

    return (
        <div className="app-container">
            {/* Decorative orb */}
            <div className="orb-bottom" />

            <header className="space-y-4">
                <span className="pill">🧭 {t('app.pill')}</span>
                <h1 className="font-display text-3xl text-gray-800">
                    {t('app.title')}
                </h1>
                <p className="text-sm text-gray-600">
                    {t('app.subtitle')}
                </p>
            </header>

            <div className="flex justify-end mt-4">
                <LanguageToggle />
            </div>

            <section className="mt-8 glass-card fade-in">
                <h2 className="font-display text-2xl text-gray-800">
                    {t('consent.title')} 👋
                </h2>

                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    {t('consent.intro')}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-blue-50 border-l-4 border-teal">
                    <p className="text-sm text-teal flex items-start gap-2">
                        <span>🔒</span>
                        <span>{t('consent.privacy')}</span>
                    </p>
                </div>

                <p className="mt-6 text-sm text-gray-700 font-medium text-center">
                    {t('consent.question')}
                </p>

                <div className="mt-5 flex flex-col gap-3">
                    <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={onAgree}
                    >
                        ✅ {t('consent.agree')}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary w-full"
                        onClick={onDisagree}
                    >
                        {t('consent.disagree')}
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center italic">
                    {t('app.translationDisclaimer')}
                </p>
            </section>
        </div>
    );
}
