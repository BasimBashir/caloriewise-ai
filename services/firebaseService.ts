import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';
import { UserProfile, DailyLog, WorkoutPlan, WeightEntry, ChatSession } from '../types';

// Export a flag to check configuration validity throughout the app
export const isFirebaseConfigValid = 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Conditionally initialize Firebase
let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // In case of initialization error, ensure services are null
    auth = null;
    db = null;
  }
} else {
  console.warn(
    "Firebase configuration is missing or invalid. Please create a Firebase project, then copy your configuration into 'firebaseConfig.ts'. See the README.md file for detailed instructions."
  );
}


export const signInWithGoogle = () => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured. Cannot sign in."));
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOutUser = () => {
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured. Cannot sign out."));
  }
  return signOut(auth);
};

// Define the structure of the user data in Firestore
export interface UserData {
  userProfile: UserProfile | null;
  dailyLogs: DailyLog[];
  workoutPlan: WorkoutPlan | null;
  weightLog: WeightEntry[];
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
}

// Function to get user data from Firestore
export const getUserData = async (userId: string): Promise<UserData | null> => {
  if (!userId || !db) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      console.log("No document for this user yet.");
      return null;
    }
  } catch (error) {
    console.error("Error getting user data from Firestore:", error);
    return null;
  }
};

// Helper function to recursively remove undefined values from an object.
// Firestore does not support `undefined` and will throw an error.
const removeUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    }
    // Check if it's a plain object, to avoid trying to process special objects like Timestamps
    if (typeof obj === 'object' && obj.constructor === Object) {
        const newObj: {[key: string]: any} = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (value !== undefined) {
                    newObj[key] = removeUndefinedValues(value);
                }
            }
        }
        return newObj;
    }
    return obj;
};


// Function to save user data to Firestore
export const saveUserData = async (userId: string, data: Partial<UserData>): Promise<void> => {
    if (!userId || !db) {
        throw new Error("Firebase not initialized or user not logged in.");
    }
    try {
        const userDocRef = doc(db, 'users', userId);
        // Sanitize the data to remove any `undefined` fields before sending to Firestore.
        const sanitizedData = removeUndefinedValues(data);
        
        await setDoc(userDocRef, sanitizedData, { merge: true });
    } catch (error) {
        console.error("Error saving user data to Firestore:", error);
        // Re-throw the error to allow the calling function to handle it
        throw error;
    }
};