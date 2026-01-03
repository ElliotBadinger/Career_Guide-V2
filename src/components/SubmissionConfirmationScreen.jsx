import { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import { downloadJson } from '../utils/exportUtils';

export function SubmissionConfirmationScreen({
    payload,
    submissionStatus,
    onRetry,
    onStartFresh,
    onDownloadJson
}) {
    const { t } = useI18n();
    const [showDetails, setShowDetails] = useState(false);

    const isSuccess = submissionStatus === 'success';
    const isFailed = submissionStatus === 'failed';
    const isPending = submissionStatus === 'pending';

    return (
        <div className="fade-in">
            {/* Status Header */}
            <div className="card mb-6 text-center">
                <span className="text-6xl mb-4 block">
                    {isSuccess ? '✅' : isFailed ? '❌' : '⏳'}
                </span>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t('submission.title')}
                </h2>
                <p className="text-gray-600 text-lg">
                    {isSuccess && t('submission.success')}
                    {isFailed && t('submission.failed')}
                    {isPending && t('submission.pending')}
                </p>
            </div>

            {/* Thank You Message */}
            {isSuccess && (
                <div className="card mb-6 bg-green-50 border-l-4 border-green-400">
                    <p className="text-green-800">
                        {t('submission.message')}
                    </p>
                    <p className="text-green-700 text-sm mt-2">
                        {t('submission.id')}: <code className="bg-green-100 px-2 py-1 rounded">{payload?.submission_id?.slice(0, 8)}...</code>
                    </p>
                </div>
            )}

            {/* Retry Section */}
            {isFailed && (
                <div className="card mb-6 bg-red-50 border-l-4 border-red-400">
                    <p className="text-red-800 mb-4">
                        {t('submission.failedMessage')}
                    </p>
                    <button
                        type="button"
                        className="btn btn-primary w-full"
                        onClick={onRetry}
                    >
                        🔄 {t('submission.retry')}
                    </button>
                </div>
            )}

            {/* Pending Indicator */}
            {isPending && (
                <div className="card mb-6 text-center">
                    <div className="animate-pulse">
                        <div className="h-2 bg-indigo-200 rounded w-3/4 mx-auto mb-4"></div>
                        <div className="h-2 bg-indigo-200 rounded w-1/2 mx-auto"></div>
                    </div>
                    <p className="text-gray-500 mt-4 text-sm">
                        {t('submission.pleaseWait')}
                    </p>
                </div>
            )}

            {/* Backup Options */}
            <div className="card mb-6">
                <h3 className="font-bold text-lg mb-4 text-center">
                    {t('submission.backupTitle')}
                </h3>
                <p className="text-gray-600 text-sm mb-4 text-center">
                    {t('submission.backupDescription')}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        className="btn btn-secondary w-full"
                        onClick={onDownloadJson}
                    >
                        💾 {t('report.export.downloadJson')}
                    </button>
                </div>
            </div>

            {/* Submission Details (Expandable) */}
            <div className="card mb-6">
                <button
                    type="button"
                    className="w-full text-left flex justify-between items-center"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <span className="font-medium text-gray-700">
                        {t('submission.detailsTitle')}
                    </span>
                    <span className="text-gray-400">
                        {showDetails ? '▲' : '▼'}
                    </span>
                </button>
                {showDetails && payload && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                        <p><strong>ID:</strong> {payload.submission_id}</p>
                        <p><strong>Time:</strong> {new Date(payload.created_at).toLocaleString()}</p>
                        <p><strong>Language:</strong> {payload.language_used}</p>
                        <p><strong>Questions Answered:</strong> {Object.keys(payload.answers || {}).length}</p>
                    </div>
                )}
            </div>

            {/* Start Fresh */}
            <button
                type="button"
                onClick={onStartFresh}
                className="btn btn-secondary w-full"
            >
                {t('nav.startFresh')}
            </button>
        </div>
    );
}
