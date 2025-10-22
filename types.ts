export enum ActivityLevel {
  Sedentary = 1.2,
  LightlyActive = 1.375,
  ModeratelyActive = 1.55,
  VeryActive = 1.725,
  ExtraActive = 1.9,
}

export enum Goal {
  Lose = 'lose',
  Maintain = 'maintain',
  Gain = 'gain',
}

export type Theme = 'light' | 'dark';

export type Language = 'en' | 'en-ur';

export interface GoogleUser {
  sub: string; // Unique user ID
  name: string;
  email: string;
  picture: string;
}

export interface UserProfile {
  name: string;
  age: number;
  sex: 'male' | 'female';
  height: number; // in inches
  weight: number; // in kg
  activityLevel: ActivityLevel;
  goal: Goal;
  targetWeight: number;
  mealsPerDay: number;
  exercisePreferences: string;
  registrationDate: string;
  exerciseFrequency: 'once' | 'twice';
  exerciseTiming: ('morning' | 'noon' | 'evening' | 'night')[];
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  nutrition: Nutrition;
}

export interface Meal {
  id: string;
  name: string;
  timestamp: string;
  items: FoodItem[];
  totalNutrition: Nutrition;
  imageUrl?: string;
}

export interface CalorieGoals {
  bmr: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

// Types for AI-generated workout plan
export interface WorkoutDetail {
  name: string;
  value: string | number;
}

export interface Workout {
  exercise: string;
  sets: string | number;
  reps: string | number;
  notes?: string;
  details: WorkoutDetail[];
  imageUrl?: string;
}

export interface WorkoutSession {
    name: string;
    workouts: Workout[];
}

export interface DailyWorkout {
  day: string;
  focus: string;
  sessions: WorkoutSession[];
}

export interface WorkoutPlan {
  planName: string;
  description: string;
  weeklySchedule: DailyWorkout[];
}

export interface WeightEntry {
    date: string;
    weight: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  totalNutrition: Nutrition;
  weight?: number;
}

// FIX: Add missing Chat types to resolve import errors.
export interface ChatMessagePart {
  text: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  parts: ChatMessagePart[];
  timestamp: string;
  grounding?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  history: ChatMessage[];
  createdAt: string;
}
