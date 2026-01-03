import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Import locale files
import enLocale from '../../config/locales/en.json';
import zuLocale from '../../config/locales/zu.json';

const locales = {
    en: enLocale,
    zu: zuLocale
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        // Try to load saved preference, default to 'zu' (Zulu) as primary
        const saved = localStorage.getItem('career_guide_language');
        return saved || 'zu';
    });

    useEffect(() => {
        localStorage.setItem('career_guide_language', language);
    }, [language]);

    const t = useCallback((key, params = {}) => {
        // Handle i18n: prefix from config
        const cleanKey = key.startsWith('i18n:') ? key.slice(5) : key;

        // Navigate nested keys like "questions.name.label"
        const keys = cleanKey.split('.');
        let value = locales[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English
                value = locales.en;
                for (const fallbackK of keys) {
                    if (value && typeof value === 'object' && fallbackK in value) {
                        value = value[fallbackK];
                    } else {
                        return cleanKey; // Return key if not found
                    }
                }
                break;
            }
        }

        // If we didn't find a string, return the key
        if (typeof value !== 'string') {
            return cleanKey;
        }

        // Replace params like {name} with actual values
        return value.replace(/\{(\w+)\}/g, (_, param) => {
            return params[param] !== undefined ? params[param] : `{${param}}`;
        });
    }, [language]);

    // Get full locale object for a specific language (useful for driver messages)
    const getLocale = useCallback((lang = language) => {
        return locales[lang] || locales.en;
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'en' ? 'zu' : 'en');
    }, []);

    return (
        <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t, getLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

export function LanguageToggle() {
    const { language, toggleLanguage } = useI18n();

    return (
        <div className="lang-toggle">
            <button
                className={language === 'zu' ? 'active' : ''}
                onClick={() => language !== 'zu' && toggleLanguage()}
                type="button"
            >
                isiZulu
            </button>
            <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => language !== 'en' && toggleLanguage()}
                type="button"
            >
                English
            </button>
        </div>
    );
}
