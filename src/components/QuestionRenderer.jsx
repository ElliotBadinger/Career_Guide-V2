import { useI18n } from '../hooks/useI18n';
import { getSaSchoolTermStatus } from '../utils/academicCalendar';

export function QuestionRenderer({ question, value, onChange }) {
    const { t } = useI18n();
    const { inTerm } = getSaSchoolTermStatus();

    const labelKey = !inTerm && question.labelHoliday ? question.labelHoliday : question.label;
    const helperKey = !inTerm && question.helperHoliday ? question.helperHoliday : question.helper;

    const renderQuestion = () => {
        switch (question.type) {
            case 'single':
                return <SingleChoice question={question} value={value} onChange={onChange} t={t} inTerm={inTerm} />;
            case 'multi':
                return <MultiChoice question={question} value={value} onChange={onChange} t={t} inTerm={inTerm} />;
            case 'text':
                return <TextInput question={question} value={value} onChange={onChange} t={t} />;
            case 'textarea':
                return <TextArea question={question} value={value} onChange={onChange} t={t} />;
            case 'consent':
                return null; // Handled separately by ConsentScreen
            default:
                return <p>Unknown question type: {question.type}</p>;
        }
    };

    return (
        <div className="fade-in">
            <div className="flex items-start gap-3 mb-4">
                {question.icon && (
                    <span className="text-3xl flex-shrink-0">{question.icon}</span>
                )}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {t(labelKey)}
                        {!question.required && (
                            <span className="text-gray-500 text-sm font-normal ml-2">
                                {t('questions.optional')}
                            </span>
                        )}
                    </h2>
                    {question.intro && (
                        <p className="text-gray-700 text-md mt-2 mb-2 italic">{t(question.intro)}</p>
                    )}
                    {helperKey && (
                        <p className="text-gray-600 text-sm mt-1">{t(helperKey)}</p>
                    )}
                </div>
            </div>

            {renderQuestion()}
        </div>
    );
}

function SingleChoice({ question, value, onChange, t, inTerm }) {
    return (
        <div className="space-y-2">
            {question.options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`option-btn ${value === option.value ? 'selected' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.icon && <span className="icon">{option.icon}</span>}
                    <span className="flex-1">{t(!inTerm && option.labelHoliday ? option.labelHoliday : option.label)}</span>
                    {value === option.value && <span>✓</span>}
                </button>
            ))}
        </div>
    );
}

function MultiChoice({ question, value = [], onChange, t, inTerm }) {
    const maxSelections = question.maxSelections || Infinity;

    const handleToggle = (optionValue) => {
        const currentValues = Array.isArray(value) ? value : [];

        if (currentValues.includes(optionValue)) {
            // Remove
            onChange(currentValues.filter(v => v !== optionValue));
        } else {
            // Add if under max
            if (currentValues.length < maxSelections) {
                onChange([...currentValues, optionValue]);
            }
        }
    };

    const isSelected = (optionValue) => {
        return Array.isArray(value) && value.includes(optionValue);
    };

    const atMax = Array.isArray(value) && value.length >= maxSelections;

    return (
        <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-2">
                {t('questions.chooseMultiplePlaceholder')}
                {maxSelections < Infinity && ` (max ${maxSelections})`}
            </p>
            {question.options.map((option) => {
                const selected = isSelected(option.value);
                const disabled = !selected && atMax;

                return (
                    <button
                        key={option.value}
                        type="button"
                        className={`option-btn ${selected ? 'selected' : ''} ${disabled ? 'opacity-50' : ''}`}
                        onClick={() => !disabled && handleToggle(option.value)}
                        disabled={disabled}
                    >
                        {option.icon && <span className="icon">{option.icon}</span>}
                        <span className="flex-1">{t(!inTerm && option.labelHoliday ? option.labelHoliday : option.label)}</span>
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300'
                            }`}>
                            {selected && '✓'}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function TextInput({ question, value = '', onChange, t }) {
    return (
        <input
            type="text"
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
            placeholder={question.placeholder ? t(question.placeholder) : t('questions.typePlaceholder')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

function TextArea({ question, value = '', onChange, t }) {
    return (
        <textarea
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none min-h-[120px] resize-none"
            placeholder={question.placeholder ? t(question.placeholder) : t('questions.typePlaceholder')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
        />
    );
}

export function WellbeingNotice({ message }) {
    const { t } = useI18n();

    return (
        <div className="wellbeing-notice mt-6">
            <p className="text-amber-800 flex items-start gap-2">
                <span className="text-xl">💛</span>
                <span>{t(message)}</span>
            </p>
        </div>
    );
}
