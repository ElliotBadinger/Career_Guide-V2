import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';

export function EmailModal({ isOpen, onClose, onSend, reportSummary }) {
    const { t } = useI18n();
    const [consent, setConsent] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const defaultEmail = 'brainstein@protonmail.com';

    const handleSend = async () => {
        if (!consent) return;

        setSending(true);
        setError(null);

        try {
            // Mode 1: Use mailto link (default, no server needed)
            const subject = encodeURIComponent('Career Guidance Report - My Path Finder');
            const body = encodeURIComponent(reportSummary);

            window.location.href = `mailto:${defaultEmail}?subject=${subject}&body=${body}`;

            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
                setConsent(false);
            }, 2000);
        } catch (err) {
            setError(t('email.error'));
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">
                    {t('email.consentTitle')}
                </h3>

                {sent ? (
                    <div className="text-center py-8">
                        <span className="text-5xl mb-4 block">✅</span>
                        <p className="text-green-600 font-medium">{t('email.sent')}</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-700 mb-4">
                            {t('email.consentText')}
                        </p>

                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-500">{t('email.recipientLabel')}</p>
                            <p className="font-medium">{defaultEmail}</p>
                        </div>

                        <label className="flex items-start gap-3 mb-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 w-5 h-5"
                            />
                            <span className="text-gray-700">
                                {t('email.consentCheckbox')}
                            </span>
                        </label>

                        {error && (
                            <p className="text-red-500 text-sm mb-4">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="btn btn-secondary flex-1"
                                onClick={onClose}
                            >
                                {t('nav.back')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary flex-1"
                                onClick={handleSend}
                                disabled={!consent || sending}
                            >
                                {sending ? t('email.sending') : t('email.send')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
