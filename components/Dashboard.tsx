import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Meal, Nutrition, CalorieGoals, WorkoutPlan, GoogleUser, WeightEntry, Theme } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import CalorieRingChart from './charts/CalorieRingChart';
import MacroBarChart from './charts/MacroBarChart';
import MealLogger from './MealLogger';
import WorkoutPlanComponent from './WorkoutPlan';
import WeightTracker from './WeightTracker';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';
import { useBackHandler } from '../hooks/useBackHandler';

interface DashboardProps {
  userProfile: UserProfile;
  googleUser: GoogleUser | null;
  calorieGoals: CalorieGoals;
  meals: Meal[];
  addMeal: (meal: Meal, date: string) => void;
  resetProfile: () => void;
  logout: () => void;
  workoutPlan: WorkoutPlan | null;
  updateWorkoutPlan: (plan: WorkoutPlan) => void;
  weightLog: WeightEntry[];
  addWeightEntry: (weight: number, date: string) => void;
  regeneratePlan: () => void;
  isUpdatingPlan: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  error: string | null;
  clearError: () => void;
  openChat: () => void;
  isGuest: boolean;
  onSignInAttempt: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);


const Dashboard: React.FC<DashboardProps> = ({ 
    userProfile, googleUser, calorieGoals, meals, addMeal, resetProfile, logout, workoutPlan, 
    updateWorkoutPlan, weightLog, addWeightEntry, regeneratePlan, isUpdatingPlan, theme, 
    setTheme, error, clearError, openChat, isGuest, onSignInAttempt, selectedDate, setSelectedDate 
}) => {
    const [isMealLoggerOpen, setIsMealLoggerOpen] = useState(false);
    const { t, t_html } = useTranslation();

    const handleMealLoggerClose = useCallback(() => {
        setIsMealLoggerOpen(false);
    }, []);

    useBackHandler(isMealLoggerOpen, handleMealLoggerClose);

    const totalConsumed: Nutrition = useMemo(() => {
        return meals.reduce((acc, meal) => {
            return {
                calories: acc.calories + meal.totalNutrition.calories,
                protein: acc.protein + meal.totalNutrition.protein,
                carbs: acc.carbs + meal.totalNutrition.carbs,
                fat: acc.fat + meal.totalNutrition.fat,
            }
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }, [meals]);

    const needsWeightReminder = useMemo(() => {
        if (weightLog.length === 0) return true;
        const lastEntryDate = new Date(weightLog[weightLog.length - 1].date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastEntryDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
    }, [weightLog]);

    const [showReminder, setShowReminder] = useState(false);

    useEffect(() => {
        setShowReminder(needsWeightReminder);
    }, [needsWeightReminder]);
    
    // Date Navigation Logic
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    
    const isToday = selectedDate === todayStr;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        const today = new Date(todayStr);
        // Add one day to today to make the comparison inclusive of the entire day
        today.setDate(today.getDate() + 1);
        if (newDate < today) {
            setSelectedDate(e.target.value);
        } else {
             setSelectedDate(todayStr);
        }
    };

    const navigateDays = (amount: number) => {
        // Create date in UTC to avoid timezone issues
        const [year, month, day] = selectedDate.split('-').map(Number);
        const currentDate = new Date(Date.UTC(year, month - 1, day));

        currentDate.setUTCDate(currentDate.getUTCDate() + amount);
        
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (currentDate <= today) {
            setSelectedDate(currentDate.toISOString().split('T')[0]);
        }
    };

    const isNextDayDisabled = useMemo(() => {
        return isToday;
    }, [isToday]);
    
    const displayDate = useMemo(() => {
        const date = new Date(selectedDate);
        // Adjust for timezone offset to display the correct local date
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        return localDate.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }, [selectedDate]);


  return (
    <>
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
        {error && (
            <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-md shadow" role="alert">
                <div className="flex">
                    <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg></div>
                    <div>
                        <p className="font-bold">{t('dashboardErrorTitle')}</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button onClick={clearError} className="ml-auto text-red-600 hover:text-red-800 font-bold text-2xl leading-none">&times;</button>
                </div>
            </div>
        )}
        {isGuest && (
            <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 mb-6 rounded-md shadow" role="alert">
                 <p className="text-sm">You are in guest mode. Your data will be lost when you close the browser. <button onClick={onSignInAttempt} className="font-bold underline hover:text-blue-800 dark:hover:text-blue-200">Sign in to save your progress!</button></p>
            </div>
        )}
        {showReminder && (
            <div className="bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-500 text-amber-700 dark:text-amber-300 p-4 mb-6 rounded-md shadow" role="alert">
                <div className="flex">
                    <div className="py-1"><svg className="fill-current h-6 w-6 text-amber-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg></div>
                    <div>
                        <p className="font-bold">{t('dashboardReminderTitle')}</p>
                        <p className="text-sm">{t('dashboardReminderText')}</p>
                    </div>
                    <button onClick={() => setShowReminder(false)} className="ml-auto text-amber-600 hover:text-amber-800 font-bold text-2xl leading-none">&times;</button>
                </div>
            </div>
        )}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                 {googleUser && <img src={googleUser.picture} alt={googleUser.name} className="w-12 h-12 rounded-full hidden sm:block" />}
                 <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{t('dashboardHello', { name: userProfile.name })}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{t('dashboardSummary')}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                 <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <ThemeSwitcher theme={theme} setTheme={setTheme} />
                 </div>
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button onClick={resetProfile} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600">{t('dashboardReset')}</button>
                    {isGuest ? (
                        <Button onClick={onSignInAttempt} className="px-3 py-2 text-sm font-semibold text-emerald-600 border border-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                            {t('dashboardSignIn')}
                        </Button>
                    ) : (
                         <button onClick={logout} className="px-3 py-2 text-sm font-semibold text-emerald-600 border border-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                            {t('dashboardLogout')}
                        </button>
                    )}
                 </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
                <h2 className="text-lg font-semibold mb-4">{t('dashboardCalories')}</h2>
                <CalorieRingChart consumed={totalConsumed.calories} goal={calorieGoals.targetCalories} theme={theme} />
                 <div className="text-sm mt-4 text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(totalConsumed.calories)}</span> {t('dashboardKcalConsumed', { goal: calorieGoals.targetCalories })}
                </div>
                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center px-2">
                    {t('dashboardBmr')} <span className="font-bold text-slate-700 dark:text-slate-200">{calorieGoals.bmr}</span> calories.
                </p>
            </Card>

             <Card className="lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">{t('dashboardMacros')}</h2>
                <MacroBarChart 
                    consumed={totalConsumed}
                    goals={{ protein: calorieGoals.targetProtein, carbs: calorieGoals.targetCarbs, fat: calorieGoals.targetFat }}
                    theme={theme}
                />
            </Card>

            <Card className="lg:col-span-3">
                <WeightTracker 
                    userProfile={userProfile}
                    weightLog={weightLog}
                    addWeightEntry={(weight) => addWeightEntry(weight, selectedDate)}
                    regeneratePlan={regeneratePlan}
                    isUpdatingPlan={isUpdatingPlan}
                    theme={theme}
                    selectedDate={selectedDate}
                />
            </Card>

            {workoutPlan && (
                <Card className="lg:col-span-3">
                   <WorkoutPlanComponent plan={workoutPlan} onPlanUpdate={updateWorkoutPlan} userProfile={userProfile} />
                </Card>
            )}

            <Card className="lg:col-span-3">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('dashboardDailyDiary')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{isToday ? t_html('dashboardToday') : displayDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => navigateDays(-1)} variant="secondary" className="px-3" aria-label={t_html('dashboardPrevDay')}>&lt; {t('dashboardPrevDay')}</Button>
                        <input 
                            type="date"
                            value={selectedDate}
                            max={todayStr}
                            onChange={handleDateChange}
                            className="p-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                            aria-label="Select date"
                        />
                        <Button onClick={() => navigateDays(1)} variant="secondary" className="px-3" disabled={isNextDayDisabled} aria-label={t_html('dashboardNextDay')}>{t('dashboardNextDay')} &gt;</Button>
                    </div>
                    <Button onClick={() => setIsMealLoggerOpen(true)} disabled={new Date(selectedDate) > new Date(todayStr)}>
                        <PlusIcon /> {t('dashboardAddMeal')}
                    </Button>
                </div>
                 {meals.length > 0 ? (
                    <div className="space-y-4">
                        {meals.map(meal => (
                             <div key={meal.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                 {meal.imageUrl && <img src={meal.imageUrl} alt="Meal" className="w-24 h-24 object-cover rounded-md"/>}
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{meal.name}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
                                        <p><span className="font-bold text-slate-800 dark:text-slate-100">{Math.round(meal.totalNutrition.calories)}</span> kcal</p>
                                        <p>P: <span className="font-bold text-slate-800 dark:text-slate-100">{Math.round(meal.totalNutrition.protein)}g</span></p>
                                        <p>C: <span className="font-bold text-slate-800 dark:text-slate-100">{Math.round(meal.totalNutrition.carbs)}g</span></p>
                                        <p>F: <span className="font-bold text-slate-800 dark:text-slate-100">{Math.round(meal.totalNutrition.fat)}g</span></p>
                                    </div>
                                     <details className="mt-2 text-xs">
                                        <summary className="cursor-pointer text-slate-500 dark:text-slate-400">View items</summary>
                                        <ul className="mt-1 list-disc list-inside text-slate-600 dark:text-slate-300">
                                            {meal.items.map((item, index) => <li key={index}>{item.name}</li>)}
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-slate-500 dark:text-slate-400">{t('dashboardNoMeals')}</p>
                        <p className="text-slate-500 dark:text-slate-400">{t('dashboardGetStarted')}</p>
                    </div>
                )}
            </Card>
        </div>

        {isMealLoggerOpen && (
            <MealLogger 
                userProfile={userProfile}
                onAddMeal={(meal) => addMeal(meal, selectedDate)}
                onClose={handleMealLoggerClose}
            />
        )}
    </div>
    <button 
        onClick={openChat}
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-900 transition-transform hover:scale-110"
        aria-label={t_html('chatbotTitle')}
        title={t_html('chatbotTitle')}
    >
        <ChatIcon />
    </button>
    </>
  );
};

export default Dashboard;