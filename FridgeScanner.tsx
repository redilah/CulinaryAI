
import React, { useRef } from 'react';
import { DietaryRestriction } from './types';

interface FridgeScannerProps {
  onCapture: (base64s: string[]) => void;
  detectedIngredients: string[];
  loading: boolean;
  loadingStep?: string;
  dietary: DietaryRestriction;
}

const FridgeScanner: React.FC<FridgeScannerProps> = ({ onCapture, detectedIngredients, loading, loadingStep, dietary }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    // Fix: Explicitly cast Array.from result to File[] to prevent 'unknown' type inference
    const files = (Array.from(fileList) as File[]).slice(0, 5);
    
    try {
      const base64Promises = files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          // Fix: Ensure 'file' is typed as Blob/File for readAsDataURL
          reader.readAsDataURL(file);
        });
      });

      const base64s = await Promise.all(base64Promises);
      onCapture(base64s);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar.");
    }
  };

  return (
    <section className="bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-slate-200/40 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col lg:flex-row items-stretch gap-10">
        
        {/* Upload Box */}
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`relative w-full lg:w-[45%] min-h-[220px] rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all border-4 border-dashed overflow-hidden ${
            loading 
              ? 'bg-slate-50 border-emerald-200 cursor-wait' 
              : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 group'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center text-center p-8">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-emerald-700 font-black text-sm uppercase tracking-widest">{loadingStep || "Analyzing..."}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-10 group-hover:scale-105 transition-transform duration-500">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
                <i className="fa-solid fa-camera-retro text-4xl text-emerald-500"></i>
              </div>
              <p className="text-slate-900 font-black uppercase text-sm tracking-widest">Scan Ingredients</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Supports up to 5 photos</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />
        </div>

        {/* Results Preview */}
        <div className="flex-1 bg-slate-50/60 rounded-[2.5rem] p-8 md:p-10 border border-slate-100">
          <header className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">Inventory Detected</h2>
            {dietary !== DietaryRestriction.None && (
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {dietary} Mode
              </span>
            )}
          </header>
          
          <div className="flex flex-wrap gap-3">
            {detectedIngredients.length > 0 ? (
              detectedIngredients.map((ing, idx) => (
                <div 
                  key={idx} 
                  className="bg-white text-emerald-700 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-black border border-emerald-100 shadow-sm animate-in zoom-in"
                >
                  {ing}
                </div>
              ))
            ) : (
              <div className="w-full py-10 opacity-30 text-center flex flex-col items-center">
                 <i className="fa-solid fa-wand-magic-sparkles text-4xl mb-4 text-slate-300"></i>
                 <p className="text-slate-500 italic text-sm font-bold">Snap a photo to start AI detection.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FridgeScanner;
