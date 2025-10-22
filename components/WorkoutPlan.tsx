import React, { useState, useCallback } from 'react';
import { UserProfile, WorkoutPlan } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import Button from './ui/Button';
import { useBackHandler } from '../hooks/useBackHandler';

interface WorkoutPlanProps {
    plan: WorkoutPlan;
    onPlanUpdate: (updatedPlan: WorkoutPlan) => void;
    userProfile: UserProfile;
}

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


const WorkoutPlanComponent: React.FC<WorkoutPlanProps> = ({ plan, onPlanUpdate, userProfile }) => {
    const [openDay, setOpenDay] = useState<string | null>(plan.weeklySchedule && plan.weeklySchedule.length > 0 ? plan.weeklySchedule[0].day : null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const { t } = useTranslation();

    const handleCloseImageViewer = useCallback(() => {
        setViewingImage(null);
    }, []);

    useBackHandler(!!viewingImage, handleCloseImageViewer);

    const toggleDay = (day: string) => {
        setOpenDay(prev => prev === day ? null : day);
    };

    const handleWorkoutChange = (dailyIndex: number, sessionIndex: number, workoutIndex: number, field: 'sets' | 'reps', value: string) => {
        const updatedPlan = JSON.parse(JSON.stringify(plan)); // Deep copy
        const targetWorkout = updatedPlan.weeklySchedule[dailyIndex].sessions[sessionIndex].workouts[workoutIndex];
        targetWorkout[field] = value;
        onPlanUpdate(updatedPlan);
    };
    
    const handleDetailChange = (dailyIndex: number, sessionIndex: number, workoutIndex: number, detailIndex: number, value: string) => {
        const updatedPlan = JSON.parse(JSON.stringify(plan)); // Deep copy
        const targetDetail = updatedPlan.weeklySchedule[dailyIndex].sessions[sessionIndex].workouts[workoutIndex].details[detailIndex];
        targetDetail.value = value;
        onPlanUpdate(updatedPlan);
    };

    const handlePrint = () => {
        window.print();
    };

    const inputClasses = "font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 w-full text-center focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500";

    return (
        <>
        {/* --- SCREEN VIEW --- */}
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold">{plan.planName}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{plan.description}</p>
                </div>
                <Button variant="secondary" onClick={handlePrint} className="no-print flex-shrink-0">
                    <ExportIcon />
                    <span className="ml-2 hidden sm:inline">Export</span>
                </Button>
            </div>
            <div className="space-y-2">
                {plan.weeklySchedule.map((daily, dailyIndex) => (
                    <div key={daily.day} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button 
                            onClick={() => toggleDay(daily.day)}
                            className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none"
                            aria-expanded={openDay === daily.day}
                        >
                            <div>
                                <h3 className="font-semibold">{daily.day}</h3>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{daily.focus}</p>
                            </div>
                           <span className={`transform transition-transform duration-200 ${openDay === daily.day ? 'rotate-180' : ''}`}>
                               <ChevronDownIcon />
                           </span>
                        </button>
                        {openDay === daily.day && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 divide-y divide-slate-200 dark:divide-slate-700">
                                {daily.sessions.map((session, sessionIndex) => (
                                    <div key={sessionIndex} className="py-4 first:pt-0 last:pb-0">
                                        <h4 className="font-semibold text-md text-emerald-700 dark:text-emerald-400 mb-3">{session.name}</h4>
                                        <ul className="space-y-3">
                                            {session.workouts.map((workout, workoutIndex) => (
                                                <li key={workoutIndex} className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 items-start py-3">
                                                    <div className="md:col-span-1 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-3">
                                                        <div className="w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                            {workout.imageUrl ? (
                                                                <img
                                                                    src={workout.imageUrl}
                                                                    alt={workout.exercise}
                                                                    className="w-full h-full object-cover rounded-md cursor-pointer hover:scale-105 transition-transform"
                                                                    onClick={() => setViewingImage(workout.imageUrl as string)}
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <ImageIcon />
                                                            )}
                                                        </div>
                                                        <span>{workout.exercise}</span>
                                                    </div>

                                                    <div className="md:col-span-2 flex flex-wrap items-end gap-x-4 gap-y-3 text-sm">
                                                        <div className="text-slate-600 dark:text-slate-400 w-20">
                                                            <label htmlFor={`sets-${dailyIndex}-${sessionIndex}-${workoutIndex}`} className="block text-xs mb-1">{t('workoutPlanSets')}</label>
                                                            <input
                                                                id={`sets-${dailyIndex}-${sessionIndex}-${workoutIndex}`}
                                                                type="text"
                                                                value={workout.sets}
                                                                onChange={(e) => handleWorkoutChange(dailyIndex, sessionIndex, workoutIndex, 'sets', e.target.value)}
                                                                className={inputClasses}
                                                                aria-label={`${workout.exercise} sets`}
                                                            />
                                                        </div>
                                                         <div className="text-slate-600 dark:text-slate-400 w-20">
                                                            <label htmlFor={`reps-${dailyIndex}-${sessionIndex}-${workoutIndex}`} className="block text-xs mb-1">{t('workoutPlanReps')}</label>
                                                            <input
                                                                id={`reps-${dailyIndex}-${sessionIndex}-${workoutIndex}`}
                                                                type="text"
                                                                value={workout.reps}
                                                                onChange={(e) => handleWorkoutChange(dailyIndex, sessionIndex, workoutIndex, 'reps', e.target.value)}
                                                                className={inputClasses}
                                                                aria-label={`${workout.exercise} reps`}
                                                            />
                                                        </div>
                                                        {workout.details && workout.details.map((detail, detailIndex) => (
                                                            <div key={detailIndex} className="text-slate-600 dark:text-slate-400 min-w-20 w-fit">
                                                                <label htmlFor={`detail-${dailyIndex}-${sessionIndex}-${workoutIndex}-${detailIndex}`} className="block text-xs mb-1">
                                                                    {t(detail.name as any)}
                                                                </label>
                                                                <input
                                                                    id={`detail-${dailyIndex}-${sessionIndex}-${workoutIndex}-${detailIndex}`}
                                                                    type="text"
                                                                    value={detail.value}
                                                                    onChange={(e) => handleDetailChange(dailyIndex, sessionIndex, workoutIndex, detailIndex, e.target.value)}
                                                                    className={inputClasses}
                                                                    aria-label={`${workout.exercise} ${detail.name}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {workout.notes && (
                                                        <div className="md:col-span-3">
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{t('workoutPlanNote')} {workout.notes}</p>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {viewingImage && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseImageViewer}
                >
                    <img 
                        src={viewingImage} 
                        alt="Exercise illustration" 
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                    <button 
                        onClick={handleCloseImageViewer}
                        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-slate-300"
                        aria-label="Close image view"
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
        
        {/* --- PRINT VIEW --- */}
        <div id="printable-workout-plan">
            <h1>CalorieWise AI Workout Plan</h1>
            <div className="plan-meta">
                <div><strong>Name:</strong> {userProfile.name}</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Weight:</strong> {userProfile.weight} kg</div>
            </div>
            <div className="plan-description">
                <h2>{plan.planName}</h2>
                <p>{plan.description}</p>
            </div>

            {plan.weeklySchedule.map((daily) => (
                <div key={daily.day} className="day-block">
                    <h3>{daily.day} - <span style={{fontWeight: 400}}>{daily.focus}</span></h3>
                    {daily.sessions.map((session, sessionIndex) => (
                        <div key={sessionIndex} className="session-block">
                            <h4>{session.name}</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{width: '25%'}}>Exercise</th>
                                        <th style={{width: '10%'}}>Sets</th>
                                        <th style={{width: '15%'}}>Reps / Duration</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.workouts.map((workout, workoutIndex) => (
                                        <tr key={workoutIndex}>
                                            <td>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                    {workout.imageUrl && <img src={workout.imageUrl} alt={workout.exercise} />}
                                                    <span>{workout.exercise}</span>
                                                </div>
                                            </td>
                                            <td>{workout.sets}</td>
                                            <td>{workout.reps}</td>
                                            <td>
                                                {workout.details?.map(d => `${d.name}: ${d.value}`).join(', ')}
                                                {workout.notes && <div className="notes">Note: {workout.notes}</div>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            ))}
        </div>
        </>
    );
};

export default WorkoutPlanComponent;