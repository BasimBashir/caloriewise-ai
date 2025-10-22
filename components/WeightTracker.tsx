import React, { useState, useMemo } from 'react';
import { UserProfile, WeightEntry, Theme, Goal } from '../types';
import WeightProgressChart from './charts/WeightProgressChart';
import Button from './ui/Button';
import { useTranslation } from '../hooks/useTranslation';

interface WeightTrackerProps {
    userProfile: UserProfile;
    weightLog: WeightEntry[];
    addWeightEntry: (weight: number) => void;
    regeneratePlan: () => void;
    isUpdatingPlan: boolean;
    theme: Theme;
    selectedDate: string;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ userProfile, weightLog, addWeightEntry, regeneratePlan, isUpdatingPlan, theme, selectedDate }) => {
    const [currentWeight, setCurrentWeight] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { t, t_html, t_single } = useTranslation();

    const handleAddWeight = () => {
        const weightValue = parseFloat(currentWeight);
        if (isNaN(weightValue) || weightValue <= 0) {
            setError(t_html('weightTrackerError'));
            return;
        }
        setError('');
        addWeightEntry(weightValue);
        setCurrentWeight('');
    };
    
    const isToday = new Date(selectedDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    const displayDate = isToday ? t_html('dashboardToday') : new Date(selectedDate).toLocaleDateString();

    const predictionData = useMemo(() => {
        if (userProfile.goal === Goal.Maintain || weightLog.length < 5) {
            return null;
        }

        const remainingWeight = userProfile.targetWeight - userProfile.weight;
        if ((userProfile.goal === Goal.Lose && remainingWeight >= 0) || (userProfile.goal === Goal.Gain && remainingWeight <= 0)) {
            return { status: 'info', messageKey: 'weightTrackerGoalReached' };
        }

        const relevantEntries = weightLog.slice(-5);
        const firstEntry = relevantEntries[0];
        const lastEntry = relevantEntries[relevantEntries.length - 1];

        const weightChange = lastEntry.weight - firstEntry.weight;
        const timeDiffMs = new Date(lastEntry.date).getTime() - new Date(firstEntry.date).getTime();
        const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);

        if (timeDiffDays < 7) {
            return null; // Not enough time has passed for a meaningful prediction
        }
        
        const weeklyRate = (weightChange / timeDiffDays) * 7;
        
        if (Math.abs(weeklyRate) < 0.01) { // Essentially no change
            return { status: 'warning', messageKey: 'weightTrackerPaceWarning' };
        }

        if (
            (userProfile.goal === Goal.Lose && weeklyRate >= 0) ||
            (userProfile.goal === Goal.Gain && weeklyRate <= 0)
        ) {
            return { status: 'warning', messageKey: 'weightTrackerPaceWarning' };
        }

        const weeksNeeded = Math.abs(remainingWeight / weeklyRate);

        let timeEstimate: string;
        if (weeksNeeded < 8) {
            const roundedWeeks = Math.round(weeksNeeded);
            const unit = roundedWeeks === 1 ? t_single('week', 'current') : t_single('weeks', 'current');
            timeEstimate = `${roundedWeeks} ${unit}`;
        } else if (weeksNeeded < 52) {
            const months = weeksNeeded / 4.345;
            const roundedMonths = Math.round(months);
            const unit = roundedMonths === 1 ? t_single('month', 'current') : t_single('months', 'current');
            timeEstimate = `${roundedMonths} ${unit}`;
        } else {
            const years = weeksNeeded / 52;
            const roundedYears = Math.round(years);
            const unit = roundedYears === 1 ? t_single('year', 'current') : t_single('years', 'current');
            timeEstimate = `${roundedYears} ${unit}`;
        }

        return {
            status: 'success',
            rate: weeklyRate,
            timeEstimate: timeEstimate,
        };
    }, [weightLog, userProfile, t_single]);

    const renderPrediction = () => {
        if (!predictionData) {
            return <p>{t('weightTrackerNotEnoughData')}</p>;
        }
    
        if (predictionData.status === 'info') {
            return <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{t(predictionData.messageKey as any)}</p>;
        }
    
        if (predictionData.status === 'warning') {
            return <p className="text-amber-600 dark:text-amber-400">{t(predictionData.messageKey as any)}</p>;
        }
    
        if (predictionData.status === 'success' && predictionData.timeEstimate && predictionData.rate) {
            const messageTemplate = t_html('weightTrackerPredictionText');
            const messageWithData = messageTemplate
                .replace('{rate}', Math.abs(predictionData.rate).toFixed(2))
                .replace('{goalWeight}', String(userProfile.targetWeight));
            const messageParts = messageWithData.split('{timeEstimate}');
    
            return (
                 <p>
                    {messageParts[0]}
                    <strong className="text-slate-800 dark:text-slate-100 font-bold">{predictionData.timeEstimate}</strong>
                    {messageParts[1]}
                </p>
            );
        }
        
        return <p>{t('weightTrackerNotEnoughData')}</p>; // Fallback
    };

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">{t('dashboardWeightProgress')}</h2>
            <div className="mb-6 h-[250px]">
                {weightLog && weightLog.length > 0 ? (
                    <WeightProgressChart data={weightLog} targetWeight={userProfile.targetWeight} theme={theme} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <p className="text-slate-500 dark:text-slate-400">{t('weightTrackerNoData')}</p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="weight-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('weightTrackerLogLabel')}</label>
                    <div className="flex gap-2">
                        <input
                            id="weight-input"
                            type="number"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            placeholder={userProfile.weight.toString()}
                            className="w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600"
                            aria-label={t_html('weightTrackerLogLabel')}
                        />
                        <Button onClick={handleAddWeight}>{t('weightTrackerLogButton')}</Button>
                    </div>
                     {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Logging for: {displayDate}</p>
                </div>
                 <Button onClick={regeneratePlan} isLoading={isUpdatingPlan} variant="secondary">
                    {t('weightTrackerUpdateButton')}
                </Button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center md:text-right">
                {t('weightTrackerUpdateSubtext')}
            </p>
            {/* New Prediction Section */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-md font-semibold mb-2">{t('weightTrackerPredictionTitle')}</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                    {renderPrediction()}
                </div>
            </div>
        </div>
    );
};

export default WeightTracker;