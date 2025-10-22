import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Meal, UserProfile } from '../types';
import { analyzeMealImage, MealAnalysisResult } from '../services/geminiService';
import { resizeImage } from '../utils/helpers';
import Button from './ui/Button';
import Loader from './ui/Loader';
import Card from './ui/Card';
import { useTranslation } from '../hooks/useTranslation';
import { useBackHandler } from '../hooks/useBackHandler';

interface MealLoggerProps {
  userProfile: UserProfile;
  onAddMeal: (meal: Meal) => void;
  onClose: () => void;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);


const MealLogger: React.FC<MealLoggerProps> = ({ userProfile, onAddMeal, onClose }) => {
  const { t, t_single, t_html, language } = useTranslation();
  
  const mealTypeKeys = [
    'Pre-Breakfast',
    'Breakfast',
    'Brunch',
    'Lunch',
    'Snack',
    'Dinner',
    'Post-Dinner Snack',
    'Pre-Workout Meal',
    'Post-Workout Meal',
  ];

  const [processedImage, setProcessedImage] = useState<{ file: File, previewUrl: string, base64: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>('Lunch');
  const [mealDetails, setMealDetails] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleStopStream = useCallback(() => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
  }, [stream]);

  const handleCloseCamera = useCallback(() => {
    handleStopStream();
    setIsCameraOpen(false);
    setCapturedImageUrl(null);
  }, [handleStopStream]);

  useBackHandler(isCameraOpen, handleCloseCamera);

  useEffect(() => {
    // Cleanup function to revoke the object URL when the component unmounts or the image changes
    return () => {
        if (processedImage?.previewUrl) {
            URL.revokeObjectURL(processedImage.previewUrl);
        }
    };
  }, [processedImage]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoadingText('Processing image...');
      setIsLoading(true);
      setError(null);
      setAnalysisResult(null);
      if (processedImage?.previewUrl) {
           URL.revokeObjectURL(processedImage.previewUrl);
      }
      try {
          const resizedData = await resizeImage(file, 768, 768);
          setProcessedImage(resizedData);
      } catch (e) {
          setError("Failed to process image. Please try a different one.");
          setProcessedImage(null);
          console.error(e);
      } finally {
          setIsLoading(false);
      }
    }
  };

  const handleAnalyzeClick = async () => {
    if (!processedImage) return;

    setLoadingText(t_single('mealLoggerAnalyzing', 'current'));
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeMealImage(processedImage.base64, processedImage.file.type, mealType, mealDetails);
      setAnalysisResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddMeal = () => {
    if (!analysisResult || !processedImage) return;
    const newMeal: Meal = {
        id: new Date().toISOString(),
        name: t_single(mealType as any, 'en'),
        timestamp: new Date().toISOString(),
        items: analysisResult.foods,
        totalNutrition: analysisResult.totalNutrition,
        imageUrl: processedImage.previewUrl,
    };
    onAddMeal(newMeal);
    onClose();
  };

  const handleOpenCamera = async () => {
    handleStopStream(); // Stop any previous stream
    setCapturedImageUrl(null);
    setCameraError(null);
    setIsCameraOpen(true);
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
            videoRef.current.srcObject = newStream;
        }
        setStream(newStream);
    } catch (err) {
        console.error("Error accessing rear camera:", err);
        // Fallback to any available camera
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setStream(newStream);
        } catch (fallbackErr) {
             console.error("Error accessing any camera:", fallbackErr);
             setCameraError(t_html('mealLoggerCameraError'));
        }
    }
  };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImageUrl(dataUrl);
                handleStopStream();
            }
        }
    };

    const dataURLtoFile = (dataurl: string, filename: string): File => {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) throw new Error('Invalid data URL');
        
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }

    const handleUsePhoto = async () => {
        if (capturedImageUrl) {
            const file = dataURLtoFile(capturedImageUrl, `meal-${Date.now()}.jpg`);
            setLoadingText('Processing image...');
            setIsLoading(true);
            setError(null);
            setAnalysisResult(null);
            if (processedImage?.previewUrl) {
                 URL.revokeObjectURL(processedImage.previewUrl);
            }
            try {
                const resizedData = await resizeImage(file, 768, 768);
                setProcessedImage(resizedData);
                handleCloseCamera();
            } catch (e) {
                setError("Failed to process captured photo.");
                setProcessedImage(null);
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('mealLoggerTitle')}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="mealType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mealLoggerSelectType')}</label>
                <select
                    id="mealType"
                    name="mealType"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {mealTypeKeys.map(key => (
                        <option key={key} value={key}>
                          {language === 'en-ur'
                            ? `${t_single(key as any, 'en')} / ${t_single(key as any, 'ur')}`
                            : t_single(key as any, 'en')}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="mealDetails" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mealLoggerOptionalDetailsLabel')}</label>
                <textarea
                    id="mealDetails"
                    name="mealDetails"
                    rows={2}
                    value={mealDetails}
                    onChange={(e) => setMealDetails(e.target.value)}
                    placeholder={t_html('mealLoggerOptionalDetailsPlaceholder')}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                />
            </div>
            
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            
            {!processedImage ? (
                <div className="mt-4 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center">
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t('mealLoggerUploadPhoto')}</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                           <UploadIcon /> {t('mealLoggerUploadFromDevice')}
                        </Button>
                        <Button onClick={handleOpenCamera} variant="secondary">
                           <CameraIcon /> {t('mealLoggerUseCamera')}
                        </Button>
                    </div>
                </div>
            ) : (
                 <div className="mt-4 flex flex-col items-center gap-4">
                    <img src={processedImage.previewUrl} alt="Meal preview" className="rounded-lg max-h-64 object-contain" />
                    <Button onClick={() => { 
                        if (processedImage?.previewUrl) URL.revokeObjectURL(processedImage.previewUrl);
                        setProcessedImage(null); 
                        setAnalysisResult(null); 
                    }} variant="secondary" className="w-full max-w-xs">
                        {t('mealLoggerChangePhoto')}
                    </Button>
                </div>
            )}


            {processedImage && !analysisResult && !isLoading && (
                 <Button onClick={handleAnalyzeClick} isLoading={isLoading} className="w-full">
                    {t('mealLoggerAnalyze')}
                </Button>
            )}

            {isLoading && <Loader text={loadingText} />}

            {error && <p className="text-red-500 text-center">{error}</p>}

            {analysisResult && (
                <div className="space-y-4 pt-4">
                    <h3 className="font-semibold text-lg">{t('mealLoggerResults')}</h3>
                    <div className="bg-emerald-50 dark:bg-emerald-900/50 p-4 rounded-lg">
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300">{t('mealLoggerTotalNutrition')}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-center">
                            <div className="bg-white/50 dark:bg-slate-700 p-2 rounded-md shadow-sm"><span className="font-bold">{Math.round(analysisResult.totalNutrition.calories)}</span><span className="text-xs text-slate-500 dark:text-slate-400 block">{t('mealLoggerCalories')}</span></div>
                            <div className="bg-white/50 dark:bg-slate-700 p-2 rounded-md shadow-sm"><span className="font-bold">{Math.round(analysisResult.totalNutrition.protein)}g</span><span className="text-xs text-slate-500 dark:text-slate-400 block">{t('mealLoggerProtein')}</span></div>
                            <div className="bg-white/50 dark:bg-slate-700 p-2 rounded-md shadow-sm"><span className="font-bold">{Math.round(analysisResult.totalNutrition.carbs)}g</span><span className="text-xs text-slate-500 dark:text-slate-400 block">{t('mealLoggerCarbs')}</span></div>
                            <div className="bg-white/50 dark:bg-slate-700 p-2 rounded-md shadow-sm"><span className="font-bold">{Math.round(analysisResult.totalNutrition.fat)}g</span><span className="text-xs text-slate-500 dark:text-slate-400 block">{t('mealLoggerFat')}</span></div>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">{t('mealLoggerIdentifiedItems')}</h4>
                        <ul className="space-y-2">
                            {analysisResult.foods.map((item, index) => (
                                <li key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md text-sm">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        {Math.round(item.nutrition.calories)} kcal, P: {Math.round(item.nutrition.protein)}g, C: {Math.round(item.nutrition.carbs)}g, F: {Math.round(item.nutrition.fat)}g
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Button onClick={handleAddMeal} className="w-full">{t('mealLoggerAddToDiary')}</Button>
                </div>
            )}
        </div>
      </Card>
    </div>

    {/* Camera Modal */}
    {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-4 text-white">
            <button onClick={handleCloseCamera} className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-slate-300 z-10">&times;</button>
            <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center">
                {!capturedImageUrl ? (
                    <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain rounded-lg"></video>
                        {cameraError && <p className="absolute bottom-4 bg-red-500/80 p-2 rounded">{cameraError}</p>}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <button onClick={handleCapture} disabled={!!cameraError} className="w-20 h-20 rounded-full bg-white/30 border-4 border-white flex items-center justify-center disabled:opacity-50">
                                <div className="w-16 h-16 rounded-full bg-white"></div>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <img src={capturedImageUrl} alt="Captured meal" className="w-auto h-auto max-w-full max-h-[calc(100%-80px)] object-contain rounded-lg" />
                         <div className="flex gap-4">
                            <Button onClick={() => handleOpenCamera()} variant="secondary">{t('mealLoggerRetake')}</Button>
                            <Button onClick={handleUsePhoto}>{t('mealLoggerUsePhoto')}</Button>
                        </div>
                    </div>
                )}
                 <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        </div>
    )}
    </>
  );
};

export default MealLogger;