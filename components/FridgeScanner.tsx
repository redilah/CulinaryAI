
import React, { useRef } from 'react';
import { DietaryRestriction } from '../types';

interface FridgeScannerProps {
  onCapture: (base64: string) => void;
  detectedIngredients: string[];
  loading: boolean;
  dietary: DietaryRestriction;
}

const FridgeScanner: React.FC<FridgeScannerProps> = ({ onCapture, detectedIngredients, loading, dietary }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full md:w-1/3 aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group shrink-0"
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-emerald-600 font-bold animate-pulse text-sm">Analyzing...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-emerald-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-camera"></i>
              </div>
              <p className="text-slate-700 font-bold">Snap Fridge Photo</p>
              <p className="text-slate-400 text-xs mt-1">AI will detect ingredients</p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="flex-1 space-y-4 w-full">
          <h2 className="text-xl font-bold text-slate-800">
            Detected Ingredients {dietary !== DietaryRestriction.None && (
              <span className="text-emerald-600 lowercase ml-1 font-extrabold italic">({dietary})</span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            {detectedIngredients.length > 0 ? (
              detectedIngredients.map((ing, idx) => (
                <span 
                  key={idx} 
                  className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <i className="fa-solid fa-check text-[10px]"></i>
                  {ing}
                </span>
              ))
            ) : (
              <p className="text-slate-400 italic text-sm">No items detected yet. Take a photo to start!</p>
            )}
          </div>
          {detectedIngredients.length > 0 && !loading && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
              <p className="text-sm text-slate-600">
                <i className="fa-solid fa-wand-magic-sparkles text-emerald-500 mr-2"></i>
                We found <strong>{detectedIngredients.length}</strong> items. Generating recipes based on your <strong>{dietary}</strong> preference.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FridgeScanner;
