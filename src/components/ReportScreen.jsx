import { useI18n } from '../hooks/useI18n';
import reportTemplates from '../../config/report_templates.v1.json';

export function ReportScreen({
    result,
    answers,
    onExportPdf,
    onExportJson,
    onCopyClipboard,
    onSendEmail
}) {
    const { t, language, getLocale } = useI18n();
    const { scores, recommendation, drivers, modifiers } = result;

    const pathData = reportTemplates.paths[recommendation];
    const risks = reportTemplates.risks[recommendation] || [];
    const actionChecklist = reportTemplates.actionChecklists[recommendation] || [];

    // Get driver messages in current language
    const driverMessages = drivers.map(driverKey => {
        const messages = reportTemplates.driverMessages[driverKey];
        return messages ? (messages[language] || messages.en) : driverKey;
    });

    // Check if wellbeing resources should be shown
    const showWellbeingResources = modifiers.some(m => m.emphasis === 'wellbeing_resources');

    return (
        <div className="fade-in">
            {/* Recommendation Header */}
            <div
                className="card mb-6 text-center"
                style={{ borderTop: `4px solid ${pathData.color}` }}
            >
                <span className="text-5xl mb-3 block">{pathData.icon}</span>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {t('report.recommendation')}
                </h2>
                <h3 className="text-2xl font-bold" style={{ color: pathData.color }}>
                    {t(pathData.title)}
                </h3>
                <p className="text-gray-600 mt-3">
                    {t(pathData.description)}
                </p>
            </div>

            {/* Why This Path */}
            <div className="card mb-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span>💡</span> {t('report.whyThisPath')}
                </h3>
                <ul className="space-y-2">
                    {driverMessages.map((message, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{t('report.driver')} {message}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Modifiers / Special Notes */}
            {modifiers.length > 0 && (
                <div className="card mb-6 bg-amber-50 border-l-4 border-amber-400">
                    <h3 className="font-bold text-lg mb-3">📌 Important Notes</h3>
                    <ul className="space-y-2">
                        {modifiers.map((mod, idx) => (
                            <li key={idx} className="text-amber-800">
                                {mod.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Path Details */}
            <div className="card mb-6">
                <h3 className="font-bold text-lg mb-3">📋 What This Means</h3>
                <p className="text-gray-700 mb-4">{pathData.details.whatItMeans}</p>

                <h4 className="font-semibold mb-2">Good for:</h4>
                <p className="text-gray-600 mb-4">{pathData.details.goodFor}</p>

                <h4 className="font-semibold mb-2">Things to consider:</h4>
                <p className="text-gray-600">{pathData.details.consider}</p>
            </div>

            {/* Risks & Mitigations */}
            <div className="card mb-6">
                <h3 className="font-bold text-lg mb-3">
                    <span>⚠️</span> {t('report.risks')}
                </h3>
                <div className="space-y-4">
                    {risks.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-gray-200 pl-4">
                            <p className="text-gray-700 font-medium">{item.risk}</p>
                            <p className="text-gray-600 text-sm mt-1">
                                ✅ {item.mitigation}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 10-Day Action Checklist */}
            <div className="card mb-6">
                <h3 className="font-bold text-lg mb-3">
                    <span>📅</span> {t('report.actionChecklist')}
                </h3>
                <div className="space-y-3">
                    {actionChecklist.map((item) => (
                        <div key={item.day} className="flex items-start gap-3">
                            <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-sm flex-shrink-0">
                                Day {item.day}
                            </span>
                            <p className="text-gray-700">{item.action}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resources */}
            <div className="card mb-6">
                <h3 className="font-bold text-lg mb-3">🔗 Helpful Resources</h3>
                <div className="space-y-3">
                    {pathData.resources.map((resource, idx) => (
                        <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                            <p className="font-medium text-indigo-600">{resource.name}</p>
                            <p className="text-gray-600 text-sm">{resource.description}</p>
                        </a>
                    ))}
                </div>
            </div>

            {/* Wellbeing Resources (if flagged) */}
            {showWellbeingResources && (
                <div className="card mb-6 bg-blue-50 border-l-4 border-blue-400">
                    <h3 className="font-bold text-lg mb-3">💙 Someone to Talk To</h3>
                    <p className="text-gray-700 mb-4">
                        {reportTemplates.disclaimer[language] || reportTemplates.disclaimer.en}
                    </p>
                    <div className="space-y-3">
                        {reportTemplates.wellbeingResources.map((resource, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg">
                                <p className="font-medium">{resource.name}</p>
                                <p className="text-gray-600 text-sm">{resource.description}</p>
                                {resource.phone && (
                                    <a
                                        href={`tel:${resource.phone.replace(/\s/g, '')}`}
                                        className="text-blue-600 font-medium"
                                    >
                                        📞 {resource.phone}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Disclaimer */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-center">
                <p className="text-gray-600 text-sm">
                    {reportTemplates.disclaimer[language] || reportTemplates.disclaimer.en}
                </p>
            </div>

            {/* Export Options */}
            <div className="card">
                <h3 className="font-bold text-lg mb-4 text-center">
                    {t('report.export.title')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        className="btn btn-secondary text-sm"
                        onClick={onCopyClipboard}
                    >
                        📋 {t('report.export.copy')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary text-sm"
                        onClick={onExportJson}
                    >
                        💾 {t('report.export.downloadJson')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary text-sm col-span-2"
                        onClick={onExportPdf}
                    >
                        📄 {t('report.export.downloadPdf')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary text-sm col-span-2"
                        onClick={onSendEmail}
                    >
                        ✉️ {t('report.export.sendEmail')}
                    </button>
                </div>
            </div>
        </div>
    );
}
