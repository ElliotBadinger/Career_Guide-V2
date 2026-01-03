import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';

export function SubmissionConsentCheckbox({ checked, onChange, disabled }) {
    const { t } = useI18n();

    return (
        <div className="card mb-6 bg-amber-50 border-l-4 border-amber-400">
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="mt-1 w-5 h-5 accent-amber-600"
                />
                <span className="text-amber-800">
                    {t('submission.consent')}
                </span>
            </label>
            {!checked && (
                <p className="text-amber-600 text-sm mt-2 ml-8">
                    {t('submission.consentRequired')}
                </p>
            )}
        </div>
    );
}
