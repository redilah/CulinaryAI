
import React, { useRef } from 'react';
import { DietaryRestriction } from './types';

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
    <section className="bg-white rounded-[2.5rem] p-5 md:p-6 shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-visible animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        
        {/* Left Side: Capture Action */}
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`relative w-full lg:w-[30%] min-h-[140px] lg:min-h-[180px] bg-slate-50 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 ${
            loading ? 'opacity-50 cursor-wait' : 'hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-xl border-slate-200 group'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em]">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform duration-300">
                <i className="fa-solid fa-camera text-2xl text-emerald-500"></i>
              </div>
              <p className="text-slate-800 font-black uppercase text-[10px] tracking-[0.15em]">Snap Photo</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
        </div>

        {/* Right Side: Ingredients Display */}
        <div className="flex-1 bg-slate-50/40 rounded-[2rem] p-4 md:p-8 border border-slate-100/50 flex flex-col justify-start min-h-[140px]">
          <header className="flex items-center justify-between mb-4 flex-wrap gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight whitespace-nowrap">My Ingredients</h2>
            </div>
            
            {dietary !== DietaryRestriction.None && (
              <div className="bg-slate-900 text-white px-2 py-1 rounded shadow-md">
                <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                  {dietary}
                </span>
              </div>
            )}
          </header>
          
          <div className="flex flex-wrap gap-2 content-start">
            {detectedIngredients.length > 0 ? (
              detectedIngredients.map((ing, idx) => (
                <div 
                  key={idx} 
                  className="bg-white text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border border-emerald-100/50 shadow-sm flex items-center gap-1.5 animate-in zoom-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                  {ing}
                </div>
              ))
            ) : (
              <div className="flex flex-col w-full opacity-60">
                 <p className="text-slate-500 italic text-xs font-semibold tracking-tight">
                    Pantry empty. Snap a photo.
                 </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FridgeScanner;
