
import React, { useRef } from 'react';

interface FridgeScannerProps {
  onCapture: (base64: string) => void;
  loading: boolean;
  ingredients: string[];
}

const FridgeScanner: React.FC<FridgeScannerProps> = ({ onCapture, loading, ingredients }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
      <div 
        onClick={() => !loading && inputRef.current?.click()}
        className={`w-full md:w-64 aspect-square bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500 hover:bg-emerald-50 ${loading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {loading ? (
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <i className="fa-solid fa-camera text-3xl text-slate-300 mb-2"></i>
            <span className="font-bold text-slate-500">Snap Photo</span>
          </>
        )}
        <input type="file" ref={inputRef} onChange={handleChange} accept="image/*" className="hidden" />
      </div>

      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Detected Ingredients</h2>
        <div className="flex flex-wrap gap-2">
          {ingredients.length > 0 ? ingredients.map((ing, i) => (
            <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 uppercase">
              {ing}
            </span>
          )) : (
            <p className="text-slate-400 italic">No ingredients scanned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FridgeScanner;
