import React, { useState, useCallback, useEffect, useRef } from 'react';
import useGlobalLocalStorage from './hooks/useGlobalLocalStorage';
import { UserProfile, DailyLog, WorkoutPlan, WeightEntry, ChatSession, Meal, CalorieGoals, GoogleUser, Theme, Language, ChatMessage } from './types';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { calculateGoals } from './utils/helpers';
import { generateWorkoutPlan, continueChat } from './services/geminiService';
import { LanguageContext } from './contexts/LanguageContext';
import Chatbot from './components/Chatbox';
import { useBackHandler } from './hooks/useBackHandler';
import { auth, isFirebaseConfigValid, signInWithGoogle } from './services/firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getUserData, saveUserData, UserData } from './services/firebaseService';
import Loader from './components/ui/Loader';
import FirebaseConfigError from './components/FirebaseConfigError';

const App: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const guestDataRef = useRef<UserData | null>(null);

  // App-wide state, now managed by React state instead of localStorage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [theme, setTheme] = useGlobalLocalStorage<Theme>('appTheme', 'light');
  const [language, setLanguage] = useGlobalLocalStorage<Language>('appLanguage', 'en');
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isAiReplying, setIsAiReplying] = useState(false);

  const activeChatSession = chatSessions.find(s => s.id === activeChatSessionId);

  const handleContinueAsGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  const handleSignInAttempt = useCallback(() => {
    // Before initiating sign-in, capture any existing guest data.
    if (isGuest && userProfile) {
        guestDataRef.current = {
            userProfile,
            dailyLogs,
            workoutPlan,
            weightLog,
            chatSessions,
            activeChatSessionId,
        };
    } else {
        guestDataRef.current = null;
    }
    // Return the promise for error handling in the Login component.
    return signInWithGoogle();
  }, [isGuest, userProfile, dailyLogs, workoutPlan, weightLog, chatSessions, activeChatSessionId]);

  // Handle Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsUserDataLoading(true);
        setIsGuest(false); // User is logged in, not a guest.
        setFirebaseUser(user);
        setGoogleUser({
          sub: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          picture: user.photoURL || '',
        });
        
        const existingFirebaseData = await getUserData(user.uid);

        if (existingFirebaseData && existingFirebaseData.userProfile) {
            // Scenario: Existing user logs in. Load their data from Firestore.
            setUserProfile(existingFirebaseData.userProfile || null);
            setDailyLogs(existingFirebaseData.dailyLogs || []);
            setWorkoutPlan(existingFirebaseData.workoutPlan || null);
            setWeightLog(existingFirebaseData.weightLog || []);
            setChatSessions(existingFirebaseData.chatSessions || []);
            setActiveChatSessionId(existingFirebaseData.activeChatSessionId || null);
        } else if (guestDataRef.current) {
            // Scenario: New user who was previously a guest. Migrate their data.
            await saveUserData(user.uid, guestDataRef.current);
            // Local state is already correct from the guest session, so we just set it again to be safe.
            setUserProfile(guestDataRef.current.userProfile);
            setDailyLogs(guestDataRef.current.dailyLogs);
            setWorkoutPlan(guestDataRef.current.workoutPlan);
            setWeightLog(guestDataRef.current.weightLog);
            setChatSessions(guestDataRef.current.chatSessions);
            setActiveChatSessionId(guestDataRef.current.activeChatSessionId);
            guestDataRef.current = null; // Clear ref after migration
        } else {
            // Scenario: Brand new user with no guest data. Go to profile setup.
            setUserProfile(null);
            setDailyLogs([]);
            setWorkoutPlan(null);
            setWeightLog([]);
            setChatSessions([]);
            setActiveChatSessionId(null);
        }
        setIsUserDataLoading(false);
      } else {
        // User logged out, reset everything
        guestDataRef.current = null; // Also clear ref on logout
        setFirebaseUser(null);
        setGoogleUser(null);
        setUserProfile(null);
        setDailyLogs([]);
        setWorkoutPlan(null);
        setWeightLog([]);
        setChatSessions([]);
        setActiveChatSessionId(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');
    if (theme === 'dark') {
        root.classList.add('dark');
    }
  }, [theme]);

  // Helper to save all user data to Firestore
  const saveData = useCallback(async (data: Partial<UserData>) => {
    if (firebaseUser) {
      await saveUserData(firebaseUser.uid, data);
    }
  }, [firebaseUser]);

  const handleLogout = useCallback(async () => {
    if (auth) {
        await auth.signOut();
    }
  }, []);

  const handleProfileCreate = useCallback(async (profile: UserProfile) => {
    setIsGeneratingPlan(true);
    try {
        const plan = await generateWorkoutPlan(profile);
        const newWeightLog: WeightEntry[] = [{ date: profile.registrationDate, weight: profile.weight }];
        
        const userDataToSave: UserData = { 
            userProfile: profile, 
            workoutPlan: plan, 
            dailyLogs: [], 
            weightLog: newWeightLog, 
            chatSessions: [], 
            activeChatSessionId: null 
        };

        // For logged-in users, save to Firestore to ensure data persistence.
        // For guests, this step is skipped.
        if (firebaseUser) {
          await saveData(userDataToSave);
        }

        // Update state locally for both guests and logged-in users to trigger UI change.
        setUserProfile(userDataToSave.userProfile);
        setWorkoutPlan(userDataToSave.workoutPlan);
        setDailyLogs(userDataToSave.dailyLogs);
        setWeightLog(userDataToSave.weightLog);
        setChatSessions(userDataToSave.chatSessions); 
        setActiveChatSessionId(userDataToSave.activeChatSessionId);

    } catch (error) {
        console.error("Failed to create profile and plan:", error);
        // Re-throw error to be caught by the calling component and displayed to the user
        throw error;
    } finally {
        setIsGeneratingPlan(false);
    }
  }, [firebaseUser, saveData]);
  
  const handleReset = useCallback(async () => {
    // Reset local state for both guests and logged-in users
    setUserProfile(null);
    setDailyLogs([]);
    setWorkoutPlan(null);
    setWeightLog([]);
    setChatSessions([]);
    setActiveChatSessionId(null);
    // If logged in, also clear data in Firestore
    if (firebaseUser) {
      await saveData({ userProfile: null, dailyLogs: [], workoutPlan: null, weightLog: [], chatSessions: [], activeChatSessionId: null });
    }
    // For a guest, this sends them back to the profile setup screen.
  }, [firebaseUser, saveData]);

  const addMeal = useCallback((meal: Meal, date: string) => {
    const dateStr = date;
    const newLogs = [...dailyLogs];
    const logIndex = newLogs.findIndex(log => log.date === dateStr);

    if (logIndex > -1) {
        const updatedLog = { ...newLogs[logIndex] };
        updatedLog.meals = [...updatedLog.meals, meal];
        updatedLog.totalNutrition = updatedLog.meals.reduce((acc, m) => ({
            calories: acc.calories + m.totalNutrition.calories,
            protein: acc.protein + m.totalNutrition.protein,
            carbs: acc.carbs + m.totalNutrition.carbs,
            fat: acc.fat + m.totalNutrition.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        newLogs[logIndex] = updatedLog;
    } else {
        const newLog: DailyLog = {
            date: dateStr,
            meals: [meal],
            totalNutrition: meal.totalNutrition,
        };
        newLogs.push(newLog);
    }
    setDailyLogs(newLogs);
    saveData({ dailyLogs: newLogs });
  }, [dailyLogs, saveData]);

  const addWeightEntry = useCallback((weight: number, date: string) => {
    const dateStr = date;
    const newEntry: WeightEntry = { date: new Date(dateStr).toISOString(), weight };
    const newWeightLog = [...weightLog, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setWeightLog(newWeightLog);

    let updatedProfile = userProfile;
    if (userProfile) {
        // Only update the main profile weight if logging for the current day
        if (dateStr === new Date().toISOString().split('T')[0]) {
            updatedProfile = { ...userProfile, weight };
            setUserProfile(updatedProfile);
        }
    }

    const newLogs = [...dailyLogs];
    const logIndex = newLogs.findIndex(log => log.date === dateStr);
    if (logIndex > -1) {
        newLogs[logIndex] = { ...newLogs[logIndex], weight: weight };
    } else {
        const newLog: DailyLog = {
            date: dateStr,
            meals: [],
            totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            weight: weight,
        };
        newLogs.push(newLog);
    }
    setDailyLogs(newLogs);
    
    saveData({ weightLog: newWeightLog, userProfile: updatedProfile, dailyLogs: newLogs });
  }, [weightLog, userProfile, dailyLogs, saveData]);

  const handleRegeneratePlan = useCallback(async () => {
    if (!userProfile) return;
    setIsGeneratingPlan(true);
    setDashboardError(null);
    try {
        const plan = await generateWorkoutPlan(userProfile);
        setWorkoutPlan(plan);
        await saveData({ workoutPlan: plan });
    } catch (error) {
        console.error("Failed to regenerate workout plan", error);
        setDashboardError(error instanceof Error ? error.message : "An unexpected error occurred while updating the plan.");
    } finally {
        setIsGeneratingPlan(false);
    }
  }, [userProfile, saveData]);

  const handleUpdateWorkoutPlan = useCallback((updatedPlan: WorkoutPlan) => {
    setWorkoutPlan(updatedPlan);
    saveData({ workoutPlan: updatedPlan });
  }, [saveData]);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang => (lang === 'en' ? 'en-ur' : 'en'));
  }, [setLanguage]);

  // Chat Handlers
  const handleCreateNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: `chat_${Date.now()}`,
      title: 'New Chat',
      history: [],
      createdAt: new Date().toISOString(),
    };
    const newSessions = [newChat, ...chatSessions];
    setChatSessions(newSessions);
    setActiveChatSessionId(newChat.id);
    saveData({ chatSessions: newSessions, activeChatSessionId: newChat.id });
  }, [chatSessions, saveData]);
  
  const handleDeleteChat = useCallback((chatId: string) => {
    const newSessions = chatSessions.filter(c => c.id !== chatId);
    let newActiveId = activeChatSessionId;
    if (activeChatSessionId === chatId) {
        newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
    }
    setChatSessions(newSessions);
    setActiveChatSessionId(newActiveId);
    saveData({ chatSessions: newSessions, activeChatSessionId: newActiveId });
  }, [activeChatSessionId, chatSessions, saveData]);

  const handleSwitchChat = useCallback((sessionId: string) => {
    setActiveChatSessionId(sessionId);
    saveData({ activeChatSessionId: sessionId });
  }, [saveData]);

  const handleSendMessage = useCallback(async (message: string, useGoogleSearch: boolean) => {
    if (!userProfile || !activeChatSessionId) return;

    const userMessage: ChatMessage = { id: `user_${Date.now()}`, role: 'user', parts: [{ text: message }], timestamp: new Date().toISOString() };
    const modelMessageId = `model_${Date.now()}`;
    const placeholderMessage: ChatMessage = { id: modelMessageId, role: 'model', parts: [{ text: '' }], timestamp: new Date().toISOString() };

    setIsAiReplying(true);

    const updatedSessions = chatSessions.map(session => 
      session.id === activeChatSessionId
        ? {
            ...session,
            title: session.history.length === 0 ? message.substring(0, 30) + (message.length > 30 ? '...' : '') : session.title,
            history: [...session.history, userMessage, placeholderMessage],
          }
        : session
    );
    setChatSessions(updatedSessions);

    try {
      const currentSession = updatedSessions.find(s => s.id === activeChatSessionId);
      if (!currentSession) throw new Error("Active session not found");

      const stream = await continueChat(userProfile, dailyLogs, workoutPlan, weightLog, currentSession.history, message, useGoogleSearch);

      let finalResponse = '';
      let latestGroundingChunks: any[] | undefined;
      for await (const chunk of stream) {
          finalResponse += chunk.text;
          const newGrounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (newGrounding) {
            latestGroundingChunks = newGrounding.map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
          }
          setChatSessions(prev => prev.map(session => {
              if (session.id === activeChatSessionId) {
                  const newHistory = session.history.map(msg => 
                      msg.id === modelMessageId ? { ...msg, parts: [{ text: finalResponse }], grounding: latestGroundingChunks || msg.grounding } : msg
                  );
                  return { ...session, history: newHistory };
              }
              return session;
          }));
      }
      
      const finalSessions = chatSessions.map(session => {
          if (session.id === activeChatSessionId) {
              const newHistory = session.history.map(msg => 
                  msg.id === modelMessageId ? { ...msg, parts: [{ text: finalResponse }], grounding: latestGroundingChunks || msg.grounding } : msg
              );
              return { ...session, history: newHistory };
          }
          return session;
      });
      await saveData({ chatSessions: finalSessions });

    } catch (error) {
       console.error("Chat error:", error);
       const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
       const errorSessions = chatSessions.map(session => {
           if (session.id === activeChatSessionId) {
               const newHistory = session.history.map(msg => 
                   msg.id === modelMessageId ? { ...msg, parts: [{ text: `Error: ${errorMessage}` }] } : msg
               );
               return { ...session, history: newHistory };
           }
           return session;
       });
       setChatSessions(errorSessions);
       await saveData({ chatSessions: errorSessions });
    } finally {
        setIsAiReplying(false);
    }
  }, [userProfile, dailyLogs, workoutPlan, weightLog, activeChatSessionId, chatSessions, saveData]);

  const handleChatbotClose = useCallback(() => setIsChatbotOpen(false), []);
  useBackHandler(isChatbotOpen, handleChatbotClose);

  const renderContent = () => {
     if (!isFirebaseConfigValid) {
        return <FirebaseConfigError />;
     }

     if (isAuthLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader text="Loading..." /></div>;
     }

     if (!firebaseUser && !isGuest) {
        return <Login 
          theme={theme} 
          setTheme={setTheme} 
          onContinueAsGuest={handleContinueAsGuest}
          onSignInAttempt={handleSignInAttempt}
        />;
    }

    if (firebaseUser && isUserDataLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader text="Loading profile..." /></div>;
    }

    if (!userProfile) {
        return <ProfileSetup onProfileCreate={handleProfileCreate} isGeneratingPlan={isGeneratingPlan} googleUser={googleUser} theme={theme} setTheme={setTheme} />;
    }
    
    const calorieGoals: CalorieGoals = calculateGoals(userProfile);
    const selectedLog = dailyLogs.find(log => log.date === selectedDate);
    const mealsForDashboard = selectedLog ? selectedLog.meals : [];

    return (
        <>
            <Dashboard 
                isGuest={isGuest}
                onSignInAttempt={handleSignInAttempt}
                userProfile={userProfile}
                googleUser={googleUser}
                calorieGoals={calorieGoals}
                meals={mealsForDashboard}
                addMeal={addMeal}
                resetProfile={handleReset}
                logout={handleLogout}
                workoutPlan={workoutPlan}
                updateWorkoutPlan={handleUpdateWorkoutPlan}
                weightLog={weightLog}
                addWeightEntry={addWeightEntry}
                regeneratePlan={handleRegeneratePlan}
                isUpdatingPlan={isGeneratingPlan}
                theme={theme}
                setTheme={setTheme}
                error={dashboardError}
                clearError={() => setDashboardError(null)}
                openChat={() => setIsChatbotOpen(true)}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
            <Chatbot
              isOpen={isChatbotOpen}
              onClose={handleChatbotClose}
              sessions={chatSessions}
              activeSession={activeChatSession}
              onNewChat={handleCreateNewChat}
              onDeleteChat={handleDeleteChat}
              onSwitchChat={handleSwitchChat}
              onSendMessage={handleSendMessage}
              isAiReplying={isAiReplying}
            />
        </>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
        <main>
            {renderContent()}
        </main>
    </LanguageContext.Provider>
  );
};

export default App;