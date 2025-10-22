import { GoogleGenAI, Type, Content } from "@google/genai";
import { FoodItem, Nutrition, UserProfile, WorkoutPlan, ActivityLevel, DailyLog, WeightEntry, ChatMessage, Workout } from '../types';

export interface MealAnalysisResult {
    foods: FoodItem[];
    totalNutrition: Nutrition;
}

const schema = {
  type: Type.OBJECT,
  properties: {
    foods: {
      type: Type.ARRAY,
      description: "List of identified food items in the meal.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Name of the food item.",
          },
          nutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER, description: "Estimated calories." },
              protein: { type: Type.NUMBER, description: "Estimated protein in grams." },
              carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams." },
              fat: { type: Type.NUMBER, description: "Estimated fat in grams." },
            },
            required: ["calories", "protein", "carbs", "fat"],
          },
        },
        required: ["name", "nutrition"],
      },
    },
    totalNutrition: {
      type: Type.OBJECT,
      description: "The sum of all nutritional values for the entire meal.",
      properties: {
        calories: { type: Type.NUMBER, description: "Total estimated calories for the meal." },
        protein: { type: Type.NUMBER, description: "Total estimated protein in grams." },
        carbs: { type: Type.NUMBER, description: "Total estimated carbohydrates in grams." },
        fat: { type: Type.NUMBER, description: "Total estimated fat in grams." },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
  },
  required: ["foods", "totalNutrition"],
};

const workoutPlanSchema = {
    type: Type.OBJECT,
    properties: {
        planName: { type: Type.STRING, description: "A catchy name for the workout plan." },
        description: { type: Type.STRING, description: "A brief, motivating description of the plan's goals." },
        weeklySchedule: {
            type: Type.ARRAY,
            description: "An array of daily workout routines for the week. The number of days should match the user's requested activity level.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "The day of the week (e.g., 'Day 1 - Monday')." },
                    focus: { type: Type.STRING, description: "The main overall focus of the day's workout (e.g., 'Full Body Strength & Cardio')." },
                    sessions: {
                        type: Type.ARRAY,
                        description: "An array of workout sessions for the day. Should be one session if user exercises once a day, two if twice a day.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Name of the session, e.g., 'Morning Cardio' or 'Strength Training'." },
                                workouts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            exercise: { type: Type.STRING, description: "Name of the exercise." },
                                            notes: { type: Type.STRING, description: "Optional brief notes on form or tempo." },
                                            details: {
                                                type: Type.ARRAY,
                                                description: "An array of specific, relevant parameters for the exercise. MUST include 'Sets' and 'Reps'. For strength exercises, add 'Weight'. For cardio, add parameters like 'Incline', 'Speed', 'Resistance', or 'Duration'.",
                                                items: {
                                                    type: Type.OBJECT,
                                                    properties: {
                                                        name: { type: Type.STRING, description: "The name of the parameter (e.g., 'Sets', 'Reps', 'Weight', 'Speed')." },
                                                        value: { type: Type.STRING, description: "The value for the parameter (e.g., '3-4', '8-12', '50 kg', '6 mph')." },
                                                    },
                                                    required: ["name", "value"],
                                                }
                                            }
                                        },
                                        required: ["exercise", "details"],
                                    },
                                },
                            },
                             required: ["name", "workouts"],
                        }
                    }
                },
                required: ["day", "focus", "sessions"],
            },
        },
    },
    required: ["planName", "description", "weeklySchedule"],
};

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  return apiKey;
};

const handleGeminiError = (error: unknown, context: string): Error => {
    console.error(`Error during ${context}:`, error);

    // Common errors for non-food images or safety blocks
    const isSafetyOrParseError = 
        (error instanceof SyntaxError) || 
        (error instanceof Error && (
            error.message.includes("candidateslist is empty") || 
            error.message.includes("finish reason: 4") ||
            // Error from our own check if the AI returns an empty body
            error.message.includes("Received an empty response") ||
            // Error from JSON.parse if AI returns text instead of JSON
            error.message.includes("Unexpected token")
        ));

    if (isSafetyOrParseError) {
        if (context === 'meal analysis') {
            return new Error("Only food-related images can be used here. The AI could not analyze the provided image.");
        }
        // Generic safety error for other contexts (like chat or workout plan)
        return new Error("The AI model did not return a response, which may be due to the safety policy. Please try a different query or image.");
    }
    
    if (error instanceof Error) {
        if (error.message.includes("API_KEY environment variable not set")) {
            return new Error("Your Gemini API key is not configured. Please follow the instructions in the README.md file to set up your .env.local file.");
        }
        if (error.message.includes("[400")) {
            return new Error(`The request to the AI service was invalid during ${context}. This might be an issue with the prompt or data format.`);
        }
        if (error.message.includes("[403")) {
            return new Error("Your Gemini API key is invalid or lacks the necessary permissions. Please check your key and try again.");
        }
    }

    return new Error(`An unexpected error occurred with the Gemini API during ${context}. Please try again later.`);
};


export const analyzeMealImage = async (
    base64Image: string,
    mimeType: string,
    mealType: string,
    mealDetails?: string,
): Promise<MealAnalysisResult> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    let promptText = `Analyze the meal in this image, which the user is logging as "${mealType}". Identify each food item, estimate its quantity, and provide a detailed nutritional breakdown including calories, protein, carbohydrates, and fat. Summarize the total nutrition for the entire meal. Provide your response in the requested JSON format.`;

    if (mealDetails && mealDetails.trim() !== '') {
        promptText += ` The user provided these additional details which should be highly prioritized for accuracy: "${mealDetails}".`;
    }

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("Received an empty response from the AI. The content may have been blocked due to safety settings.");
    }
    const result = JSON.parse(jsonText) as MealAnalysisResult;
    return result;

  } catch (error) {
    throw handleGeminiError(error, "meal analysis");
  }
};

const fetchExerciseImage = async (exerciseName: string): Promise<string | undefined> => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    // More robust check for placeholder or invalid keys.
    const isInvalidApiKey = !apiKey || apiKey.startsWith('YOUR_');
    const isInvalidCseId = !cseId || cseId.startsWith('YOUR_');

    if (isInvalidApiKey || isInvalidCseId) {
        console.warn("Google Search API Key or Custom Search Engine ID is missing or using placeholder values from the README. Please configure them in your .env.local file to enable exercise images. Skipping image fetch.");
        return undefined;
    }
    
    const simpleExerciseName = exerciseName.split('(')[0].trim();
    const query = `${simpleExerciseName} exercise demonstration`;
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&searchType=image&imgSize=medium&safe=active&imgType=photo`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
             // Provide more specific feedback in the console for developers
            if (errorData?.error?.message) {
                 console.error(`Google Custom Search API Error: ${errorData.error.message}. This could be due to an invalid API key, an incorrectly configured Search Engine ID, or exceeded quotas.`);
            } else {
                console.error(`Google Custom Search API error: ${response.statusText}`);
            }
            return undefined;
        }
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            for (const item of data.items) {
                 // Prefer https links and check for common image formats
                if (item.link && item.link.startsWith('https://') && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.link)) {
                    return item.link;
                }
            }
            // If no suitable image is found in the first loop, return the first link as a fallback
            return data.items[0].link;
        }
        console.warn(`No image found for "${query}"`);
        return undefined;
    } catch (error) {
        console.error("Failed to fetch image from Google Custom Search", error);
        return undefined;
    }
};


export const generateWorkoutPlan = async (
    profile: UserProfile
): Promise<WorkoutPlan> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const activityLevelMap: { [key: number]: string } = {
            [ActivityLevel.Sedentary]: "Sedentary (little or no exercise)",
            [ActivityLevel.LightlyActive]: "Lightly Active (exercise 1-3 days/week)",
            [ActivityLevel.ModeratelyActive]: "Moderately Active (exercise 3-5 days/week)",
            [ActivityLevel.VeryActive]: "Very Active (exercise 6-7 days/week)",
            [ActivityLevel.ExtraActive]: "Extra Active (very hard exercise & physical job)",
        };

        let workoutDaysInstruction: string;
        switch (profile.activityLevel) {
            case ActivityLevel.Sedentary:
                workoutDaysInstruction = "a 2-3 day";
                break;
            case ActivityLevel.LightlyActive:
                workoutDaysInstruction = "a 3-day";
                break;
            case ActivityLevel.ModeratelyActive:
                workoutDaysInstruction = "a 4-5 day";
                break;
            case ActivityLevel.VeryActive:
                workoutDaysInstruction = "a 6-day";
                break;
            case ActivityLevel.ExtraActive:
                workoutDaysInstruction = "an intense 6-7 day";
                break;
            default:
                workoutDaysInstruction = "a balanced 3-5 day";
        }

        const activityLevelText = activityLevelMap[profile.activityLevel] || "not specified";
        const frequencyText = profile.exerciseFrequency === 'once' ? 'once a day' : `twice a day, specifically during the ${profile.exerciseTiming.join(' and ')}.`;
        
        const feet = Math.floor(profile.height / 12);
        const inches = profile.height % 12;
        const heightText = `${feet}'${inches}"`;

        const prompt = `Based on the following user profile, create a personalized weekly workout plan. The user is a ${profile.age}-year-old ${profile.sex}, currently weighs ${profile.weight} kg, is ${heightText} tall. Their primary goal is to ${profile.goal} weight, with a target of ${profile.targetWeight} kg. They started on ${new Date(profile.registrationDate).toLocaleDateString()}. Their self-reported activity level is "${activityLevelText}". They mentioned their exercise preferences are: "${profile.exercisePreferences}". They eat ${profile.mealsPerDay} meals a day and plan to exercise ${frequencyText}.

Generate ${workoutDaysInstruction} workout plan suitable for their goals and preferences.
- Ensure the plan includes a mix of resistance training and cardiovascular elements appropriate for their goal.
- If the user exercises twice a day, create two distinct, complementary sessions for each workout day (e.g., a 'Morning Session' and an 'Evening Session').
- For EACH exercise, you MUST provide a 'details' array. This array MUST include objects for 'Sets' and 'Reps' (or duration).
- For strength exercises (like squats, presses, rows), the 'details' array must ALSO include an object for 'Weight' (e.g., { "name": "Weight", "value": "50 kg" }).
- For cardio machines (like treadmills, ellipticals, bikes), the 'details' array must ALSO include relevant settings like 'Duration', 'Speed', 'Incline', or 'Resistance Level'.
- Use common, searchable names for exercises (e.g., "Barbell Squat", "Dumbbell Bench Press", "Treadmill Run").
- Example 'details' for a strength exercise: [{ "name": "Sets", "value": "3" }, { "name": "Reps", "value": "10" }, { "name": "Weight", "value": "50 kg" }]
- Example 'details' for a cardio exercise: [{ "name": "Sets", "value": "1" }, { "name": "Reps", "value": "20 minutes" }, { "name": "Incline", "value": "5%" }]
- Provide your response in the requested JSON format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: workoutPlanSchema,
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Received an empty response from the AI. The content may have been blocked due to safety settings.");
        }
        
        let plan = JSON.parse(jsonText) as any; // Parse as any to allow transformation

        // First, transform the data to fit the frontend's expected structure.
        plan.weeklySchedule.forEach((daily: any) => {
            daily.sessions.forEach((session: any) => {
                session.workouts.forEach((workout: any) => {
                    const setsDetail = workout.details.find((d: any) => d.name === 'Sets');
                    const repsDetail = workout.details.find((d: any) => d.name === 'Reps');
                    
                    workout.sets = setsDetail ? setsDetail.value : 'N/A';
                    workout.reps = repsDetail ? repsDetail.value : 'N/A';

                    // Filter out Sets and Reps from the details array to avoid duplication in the UI
                    workout.details = workout.details.filter(
                        (d: any) => d.name !== 'Sets' && d.name !== 'Reps'
                    );
                });
            });
        });

        // Now, fetch all images concurrently for better performance.
        const allWorkouts = plan.weeklySchedule.flatMap((d: any) => d.sessions.flatMap((s: any) => s.workouts));
        await Promise.all(
            allWorkouts.map(async (workout: Workout) => {
                workout.imageUrl = await fetchExerciseImage(workout.exercise);
            })
        );

        return plan as WorkoutPlan;

    } catch (error) {
        throw handleGeminiError(error, "workout plan generation");
    }
};


export const continueChat = async (
    userProfile: UserProfile,
    dailyLogs: DailyLog[],
    workoutPlan: WorkoutPlan | null,
    weightLog: WeightEntry[],
    history: ChatMessage[],
    userMessage: string,
    useGoogleSearch: boolean
) => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        const feet = Math.floor(userProfile.height / 12);
        const inches = userProfile.height % 12;

        const recentLogs = dailyLogs.slice(-7).map(log => 
            `- Date: ${log.date}, Cals: ${Math.round(log.totalNutrition.calories)}, Weight: ${log.weight ? `${log.weight}kg` : 'N/A'}`
        ).join('\n');
        
        const weightHistory = weightLog.slice(-10).map(entry => 
            `- Date: ${new Date(entry.date).toLocaleDateString()}, Weight: ${entry.weight}kg`
        ).join('\n');

        const systemInstruction = `You are CalorieWise AI, a helpful and knowledgeable weight-loss and fitness assistant.
        Today's date is ${new Date().toLocaleDateString()}.
        You have access to the user's complete profile and history. Use this information to provide personalized, accurate, and supportive answers.
        
        **USER PROFILE:**
        - Name: ${userProfile.name}
        - Age: ${userProfile.age}
        - Sex: ${userProfile.sex}
        - Height: ${feet}'${inches}"
        - Started On: ${new Date(userProfile.registrationDate).toLocaleDateString()}
        - Goal: ${userProfile.goal} weight
        - Starting Weight: ${weightLog[0]?.weight || userProfile.weight} kg
        - Current Weight: ${userProfile.weight} kg
        - Target Weight: ${userProfile.targetWeight} kg
        - Activity Level: ${Object.keys(ActivityLevel).find(key => ActivityLevel[key as keyof typeof ActivityLevel] === userProfile.activityLevel)}

        **WORKOUT PLAN SUMMARY:**
        ${workoutPlan ? `- Plan: ${workoutPlan.planName}\n- Description: ${workoutPlan.description}` : "- No workout plan generated yet."}

        **RECENT WEIGHT HISTORY (last 10 entries):**
        ${weightHistory || "No weight history yet."}

        **RECENT DAILY LOGS (last 7 days):**
        ${recentLogs || "No meals logged recently."}

        When answering, be encouraging and actionable. If you use information from Google Search, you MUST cite your sources.
        `;

        const contents: Content[] = history.map(h => ({
            role: h.role,
            parts: h.parts
        }));
        
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                tools: useGoogleSearch ? [{googleSearch: {}}] : undefined,
            }
        });

        return response;

    } catch (error) {
        throw handleGeminiError(error, "chat session");
    }
};