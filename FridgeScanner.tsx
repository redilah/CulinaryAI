
import React, { useRef, useState } from 'react';
import { DietaryRestriction } from './types';

interface FridgeScannerProps {
  onCapture: (base64s: string[]) => void;
  detectedIngredients: string[];
  loading: boolean;
  dietary: DietaryRestriction;
}

const FridgeScanner: React.FC<FridgeScannerProps> = ({ onCapture, detectedIngredients, loading, dietary }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files as FileList;
    let files = Array.from(fileList || []);
    if (files.length === 0) return;
    
    // Limit to maximum 5 photos as requested
    if (files.length > 5) {
      alert("Maksimal 5 foto saja ya agar proses tetap cepat dan akurat.");
      files = files.slice(0, 5);
    }
    
    setSelectedCount(files.length);

    try {
      const base64Promises = files.map((file: File) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error("Gagal membaca file"));
          reader.readAsDataURL(file);
        });
      });

      const base64s = await Promise.all(base64Promises);
      onCapture(base64s);
    } catch (err) {
      console.error("Error reading files:", err);
      alert("Gagal memproses gambar. Coba pilih foto dengan ukuran lebih kecil.");
    }
  };

  return (
    <section className="bg-white rounded-[2.5rem] p-5 md:p-6 shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-visible animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        
        {/* Left Side: Capture Action */}
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`relative w-full lg:w-[35%] min-h-[160px] lg:min-h-[200px] bg-slate-50 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 ${
            loading ? 'opacity-50 cursor-wait' : 'hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-xl border-slate-200 group'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em]">Analysing {selectedCount} Photos...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform duration-300">
                <i className="fa-solid fa-camera-retro text-2xl text-emerald-500"></i>
              </div>
              <p className="text-slate-800 font-black uppercase text-[10px] tracking-[0.15em]">Snap Fridge Photos</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Maximum 5 photos per analysis</p>
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

        {/* Right Side: Ingredients Display */}
        <div className="flex-1 bg-slate-50/40 rounded-[2rem] p-4 md:p-8 border border-slate-100/50 flex flex-col justify-start min-h-[140px]">
          <header className="flex items-center justify-between mb-4 flex-wrap gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight whitespace-nowrap">Inventory Detected</h2>
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
                    No ingredients found. Upload up to 5 photos.
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
