import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityLevel, Goal, GoogleUser, Theme } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

interface ProfileSetupProps {
  onProfileCreate: (profile: UserProfile) => Promise<void>;
  isGeneratingPlan?: boolean;
  googleUser: GoogleUser | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileCreate, isGeneratingPlan, googleUser, theme, setTheme }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
      name: googleUser?.name || '',
      sex: 'male',
      activityLevel: ActivityLevel.LightlyActive,
      goal: Goal.Lose,
      mealsPerDay: 3,
      exerciseFrequency: 'once',
      exerciseTiming: [],
  });
  const [error, setError] = useState('');
  const { t, t_html } = useTranslation();
  
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  
  useEffect(() => {
    if (profile.height && profile.height > 0) {
        const totalInchesValue = profile.height;
        const feet = Math.floor(totalInchesValue / 12);
        const inches = totalInchesValue % 12;
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
    }
  }, []); // Runs once on mount

  const baseInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-emerald-500 focus:border-emerald-500";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: ['age', 'height', 'weight', 'targetWeight', 'mealsPerDay', 'activityLevel'].includes(name) ? parseFloat(value) : value }));
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFeet = heightFeet;
    let newInches = heightInches;

    if (name === 'height_ft') {
        newFeet = value;
        setHeightFeet(value);
    } else if (name === 'height_in') {
        newInches = value;
        setHeightInches(value);
    }

    if (newFeet && newInches) {
        const feetNum = parseInt(newFeet, 10);
        const inchesNum = parseInt(newInches, 10);
        if (!isNaN(feetNum) && !isNaN(inchesNum)) {
            const totalInches = (feetNum * 12) + inchesNum;
            setProfile(prev => ({ ...prev, height: totalInches }));
        }
    }
  };
  
  const handleTimingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setProfile(prev => {
        const currentTimings = prev.exerciseTiming || [];
        if (checked) {
            return { ...prev, exerciseTiming: [...currentTimings, value as any] };
        } else {
            return { ...prev, exerciseTiming: currentTimings.filter(t => t !== value) };
        }
    });
  };

  const validateStep1 = () => !!(profile.name && profile.age && profile.sex && profile.height && profile.weight);
  const validateStep2 = () => !!(profile.activityLevel && profile.goal && profile.targetWeight && profile.mealsPerDay);
  const validateStep3 = () => !!(profile.exercisePreferences && profile.exerciseFrequency && (profile.exerciseFrequency === 'once' || (profile.exerciseTiming && profile.exerciseTiming.length > 0)));

  const handleNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) {
        setError(t_html('errorRequiredStep'));
        return;
    }
    if (step === 2 && !validateStep2()) {
        setError(t_html('errorRequiredStep'));
        return;
    }
    setStep(s => s + 1);
  }

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) {
        setError(t_html('errorRequired'));
        return;
    }
    setError('');
    const completeProfile = {
      ...profile,
      registrationDate: new Date().toISOString(),
    } as UserProfile;
    
    try {
        await onProfileCreate(completeProfile);
    } catch (error) {
        setError(error instanceof Error ? error.message : 'An unexpected error occurred during profile creation.');
    }
  };
  
  const progress = Math.round((step / 3) * 100);
  const welcomeName = googleUser ? `, ${googleUser.name.split(' ')[0]}` : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
         <div className="flex justify-end items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </div>
        <div className="mb-6 mt-2">
            <h1 className="text-2xl font-bold text-center mb-1 text-slate-800 dark:text-slate-100">{t('setupWelcome')}</h1>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-4">{t_html('setupSubtext', { welcomeName })}</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-1">{t_html('setupStep', { step })}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
                <>
                    <h2 className="font-semibold text-lg text-slate-700 dark:text-slate-200">{t('setupAboutYou')}</h2>
                    <input type="text" name="name" placeholder={t_html('setupYourName')} value={profile.name || ''} onChange={handleChange} className={baseInputClasses} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="number" name="age" placeholder={t_html('setupAge')} value={profile.age || ''} onChange={handleChange} className={baseInputClasses} />
                        <select name="sex" onChange={handleChange} value={profile.sex} className={`${baseInputClasses} bg-white`}>
                            <option value="male">{t_html('setupMale')}</option>
                            <option value="female">{t_html('setupFemale')}</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">{t('setupHeight')}</label>
                            <div className="flex gap-2">
                                <select name="height_ft" value={heightFeet} onChange={handleHeightChange} className={`${baseInputClasses} bg-white`} aria-label={t_html('setupHeight')}>
                                    <option value="" disabled>{t_html('setupFeet')}</option>
                                    {[...Array(5)].map((_, i) => <option key={i + 3} value={i + 3}>{i + 3}</option>)}
                                </select>
                                <select name="height_in" value={heightInches} onChange={handleHeightChange} className={`${baseInputClasses} bg-white`} aria-label={t_html('setupHeight')}>
                                    <option value="" disabled>{t_html('setupInches')}</option>
                                    {[...Array(12)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="weight" className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">{t('setupWeight')}</label>
                            <input id="weight" type="number" name="weight" placeholder="e.g. 70" value={profile.weight || ''} onChange={handleChange} className={baseInputClasses} />
                        </div>
                    </div>
                </>
            )}

            {step === 2 && (
                 <>
                    <h2 className="font-semibold text-lg text-slate-700 dark:text-slate-200">{t('setupGoalsLifestyle')}</h2>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('setupActivityLevel')}</label>
                        <select name="activityLevel" onChange={handleChange} value={profile.activityLevel} className={`${baseInputClasses} bg-white`}>
                            <option value={ActivityLevel.Sedentary}>{t_html('setupActivitySedentary')}</option>
                            <option value={ActivityLevel.LightlyActive}>{t_html('setupActivityLightly')}</option>
                            <option value={ActivityLevel.ModeratelyActive}>{t_html('setupActivityModerately')}</option>
                            <option value={ActivityLevel.VeryActive}>{t_html('setupActivityVery')}</option>
                            <option value={ActivityLevel.ExtraActive}>{t_html('setupActivityExtra')}</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('setupPrimaryGoal')}</label>
                            <select name="goal" onChange={handleChange} value={profile.goal} className={`${baseInputClasses} bg-white`}>
                                <option value={Goal.Lose}>{t_html('setupGoalLose')}</option>
                                <option value={Goal.Maintain}>{t_html('setupGoalMaintain')}</option>
                                <option value={Goal.Gain}>{t_html('setupGoalGain')}</option>
                            </select>
                        </div>
                        <div className="self-end">
                            <input type="number" name="targetWeight" placeholder={t_html('setupTargetWeight')} value={profile.targetWeight || ''} onChange={handleChange} className={baseInputClasses} />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('setupMealsPerDay')}</label>
                        <select name="mealsPerDay" onChange={handleChange} value={profile.mealsPerDay} className={`${baseInputClasses} bg-white`}>
                            <option value={2}>{t_html('setupMealsTwo')}</option>
                            <option value={3}>{t_html('setupMealsThree')}</option>
                            <option value={4}>{t_html('setupMealsFour')}</option>
                            <option value={5}>{t_html('setupMealsFive')}</option>
                            <option value={6}>{t_html('setupMealsSix')}</option>
                        </select>
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <h2 className="font-semibold text-lg text-slate-700 dark:text-slate-200">{t('setupFitness')}</h2>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('setupExercisePrefs')}</label>
                        <textarea name="exercisePreferences" value={profile.exercisePreferences || ''} onChange={handleChange} placeholder={t_html('setupExercisePrefsPlaceholder')} rows={3} className={baseInputClasses}></textarea>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('setupExerciseFreq')}</label>
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                <input type="radio" name="exerciseFrequency" value="once" checked={profile.exerciseFrequency === 'once'} onChange={handleChange} />
                                {t('setupFreqOnce')}
                            </label>
                            <label className="flex items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                <input type="radio" name="exerciseFrequency" value="twice" checked={profile.exerciseFrequency === 'twice'} onChange={handleChange} />
                                {t('setupFreqTwice')}
                            </label>
                        </div>
                    </div>
                     {profile.exerciseFrequency === 'twice' && (
                        <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('setupExerciseTiming')}</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('setupTimingSubtext')}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {['morning', 'noon', 'evening', 'night'].map(time => (
                                    <label key={time} className="flex items-center gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <input type="checkbox" value={time} checked={profile.exerciseTiming?.includes(time as any)} onChange={handleTimingChange} />
                                        <span className="capitalize">{t(`setupTime${time.charAt(0).toUpperCase() + time.slice(1)}` as any)}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                {t('setupTimeDesc')}
                            </p>
                        </div>
                    )}
                </>
            )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex justify-between items-center !mt-6">
            {step > 1 && <Button type="button" variant="secondary" onClick={handleBack}>{t('setupBack')}</Button>}
            {step < 3 && <Button type="button" onClick={handleNext} className={step === 1 ? 'w-full' : ''}>{t('setupNext')}</Button>}
            {step === 3 && <Button type="submit" isLoading={isGeneratingPlan} className="w-full">{t('setupCreateProfile')}</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSetup;
