
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
    
    const files = Array.from(fileList).slice(0, 5) as File[];
    
    try {
      const base64Promises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Membersihkan header base64 (sangat penting untuk kestabilan mobile)
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
          };
          reader.onerror = (err) => {
            console.error("FileReader error on mobile:", err);
            reject(err);
          };
          reader.readAsDataURL(file);
        });
      });

      const base64s = await Promise.all(base64Promises);
      onCapture(base64s);
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Critical Scanner Error:", err);
      alert("Maaf, sistem gagal memproses foto Anda. Pastikan format gambar benar.");
    }
  };

  return (
    <section className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-10 shadow-2xl shadow-slate-200/40 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-stretch gap-6 md:gap-10">
        
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`relative w-full lg:w-[45%] min-h-[200px] md:min-h-[280px] rounded-[2.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all border-4 border-dashed overflow-hidden ${
            loading 
              ? 'bg-slate-50 border-emerald-200 cursor-wait' 
              : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 group'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-14 h-14 md:w-16 md:h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4 md:mb-6"></div>
              <p className="text-emerald-700 font-black text-xs md:text-sm uppercase tracking-widest">{loadingStep || "Menganalisa..."}</p>
              <p className="text-slate-400 text-[10px] mt-2 italic font-medium">Mohon tunggu, koki sedang meneliti foto...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-8 group-hover:scale-105 transition-transform duration-500">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl mb-4 md:mb-6">
                <i className="fa-solid fa-camera-retro text-3xl md:text-4xl text-emerald-500"></i>
              </div>
              <p className="text-slate-900 font-black uppercase text-xs md:text-sm tracking-widest">Pindai Bahan Dapur</p>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Ketuk untuk mengambil foto</p>
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

        <div className="flex-1 bg-slate-50/60 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 flex flex-col min-h-[220px]">
          <header className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">Bahan Ditemukan</h2>
            {dietary !== DietaryRestriction.None && (
              <span className="bg-slate-900 text-white px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                {dietary}
              </span>
            )}
          </header>
          
          <div className="flex flex-wrap gap-2 md:gap-3 flex-1 items-start">
            {detectedIngredients.length > 0 ? (
              detectedIngredients.map((ing, idx) => (
                <div 
                  key={idx} 
                  className="bg-white text-emerald-700 px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-black border border-emerald-100 shadow-sm animate-in zoom-in"
                >
                  {ing}
                </div>
              ))
            ) : (
              <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center opacity-40 text-center">
                 <i className="fa-solid fa-wand-magic-sparkles text-3xl md:text-4xl mb-3 text-slate-300"></i>
                 <p className="text-slate-500 italic text-xs md:text-sm font-bold">Menunggu pemindaian Anda...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default FridgeScanner;
