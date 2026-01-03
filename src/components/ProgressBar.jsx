import { useI18n } from '../hooks/useI18n';

export function ProgressBar({ current, total }) {
    const { t } = useI18n();
    const percentage = Math.round((current / total) * 100);

    // Milestone emojis
    const getMilestoneEmoji = () => {
        if (percentage >= 75) return '✨';
        if (percentage >= 50) return '🌟';
        if (percentage >= 25) return '💫';
        return '🚀';
    };

    const getMilestoneMessage = () => {
        if (percentage >= 75) return t('progress.almostThere');
        if (percentage >= 50) return t('progress.halfWay');
        if (percentage >= 25) return t('progress.goodStart');
        return '';
    };

    return (
        <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-gray-500">
                <span>
                    Step {current + 1} of {total}
                </span>
                <span className="flex items-center gap-2">
                    <span>{getMilestoneEmoji()}</span>
                    <span>{percentage}%</span>
                </span>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {getMilestoneMessage() && (
                <p className="text-xs text-teal text-center font-medium">
                    {getMilestoneMessage()}
                </p>
            )}
        </div>
    );
}
