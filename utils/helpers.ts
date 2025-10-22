
import { UserProfile, CalorieGoals, Goal } from '../types';

// Calculates BMR, TDEE, and macronutrient goals.
export const calculateGoals = (profile: UserProfile): CalorieGoals => {
  // profile.height is now in inches. Convert to cm for the formula.
  const heightInCm = profile.height * 2.54;

  let bmr: number;
  if (profile.sex === 'male') {
    bmr = 10 * profile.weight + 6.25 * heightInCm - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * heightInCm - 5 * profile.age - 161;
  }

  const tdee = bmr * profile.activityLevel;

  let targetCalories: number;
  switch (profile.goal) {
    case Goal.Lose:
      targetCalories = tdee - 500; // 500 calorie deficit for ~1lb/week loss
      break;
    case Goal.Gain:
      targetCalories = tdee + 500;
      break;
    case Goal.Maintain:
    default:
      targetCalories = tdee;
      break;
  }
  
  // Macronutrient split: 40% carbs, 30% protein, 30% fat
  const targetCarbs = (targetCalories * 0.40) / 4; // 4 calories per gram
  const targetProtein = (targetCalories * 0.30) / 4; // 4 calories per gram
  const targetFat = (targetCalories * 0.30) / 9; // 9 calories per gram

  return {
    bmr: Math.round(bmr),
    targetCalories: Math.round(targetCalories),
    targetProtein: Math.round(targetProtein),
    targetCarbs: Math.round(targetCarbs),
    targetFat: Math.round(targetFat),
  };
};

export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<{ file: File, previewUrl: string, base64: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            if (!event.target?.result) {
                return reject(new Error("FileReader did not return a result."));
            }
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed'));
                    }
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    const previewUrl = URL.createObjectURL(newFile);
                    
                    const readerForBase64 = new FileReader();
                    readerForBase64.readAsDataURL(newFile);
                    readerForBase64.onloadend = () => {
                        const base64String = (readerForBase64.result as string).split(',')[1];
                        resolve({ file: newFile, previewUrl, base64: base64String });
                    };
                    readerForBase64.onerror = (error) => reject(error);

                }, 'image/jpeg', 0.85); // Use JPEG with 85% quality for good compression
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};