
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
    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`w-full md:w-1/3 aspect-video md:aspect-square bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
            loading ? 'opacity-50' : 'hover:border-emerald-500 hover:bg-emerald-50'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-emerald-600 font-bold text-sm">Analyzing...</p>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-camera text-4xl text-slate-300 mb-4"></i>
              <p className="text-slate-500 font-bold">Snap Fridge Photo</p>
            </>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
        </div>

        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Detected Ingredients
            {dietary !== DietaryRestriction.None && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">{dietary}</span>}
          </h2>
          <div className="flex flex-wrap gap-2">
            {detectedIngredients.length > 0 ? (
              detectedIngredients.map((ing, idx) => (
                <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-100 animate-in zoom-in duration-300">
                  {ing}
                </span>
              ))
            ) : (
              <p className="text-slate-400 italic text-sm">No ingredients detected yet. Snap a photo!</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FridgeScanner;
