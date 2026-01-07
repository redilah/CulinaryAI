
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, ShoppingItem } from './types';
import { speakText } from './services/geminiService';
import { LiveAssistant } from './services/liveAssistantService';

interface CookingModeProps {
  recipe: Recipe;
  shoppingList: ShoppingItem[];
  onExit: () => void;
  onAddToShoppingList: (name: string) => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, shoppingList, onExit, onAddToShoppingList }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [transcriptionLogs, setTranscriptionLogs] = useState<string[]>([]);
  const [mobileSlide, setMobileSlide] = useState<'overview' | 'execution'>('overview');
  
  const liveRef = useRef<LiveAssistant | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const instructions = lang === 'ID' ? recipe.instructionsID : recipe.instructionsEN;
  const ingredientsList = lang === 'ID' ? (recipe.ingredientsID || recipe.ingredients) : (recipe.ingredientsEN || recipe.ingredients);

  // UI Translations
  const t = {
    exit: lang === 'ID' ? 'Keluar' : 'Exit',
    backToIngredients: lang === 'ID' ? '< Ingredients' : '< Ingredients',
    ingredientsTitle: lang === 'ID' ? 'Bahan-bahan' : 'Ingredients',
    instructions: lang === 'ID' ? 'Instruksi' : 'Instructions',
    step: lang === 'ID' ? 'Langkah' : 'Step',
    of: lang === 'ID' ? 'dari' : 'of',
    prev: lang === 'ID' ? 'Sebelumnya' : 'Previous',
    next: lang === 'ID' ? 'Langkah Berikutnya >' : 'Next Step >',
    finish: lang === 'ID' ? 'Selesai' : 'Finish Dish',
    start: lang === 'ID' ? 'Mulai Memasak Sekarang' : 'Start Cooking Now',
    nowCooking: lang === 'ID' ? 'Sedang Memasak' : 'Now Cooking',
    assistantLog: lang === 'ID' ? 'Log Asisten Nary' : 'Nary Assistant Log'
  };

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptionLogs]);

  const handleToggleLive = async () => {
    if (isLiveActive) {
      liveRef.current?.stop();
      setIsLiveActive(false);
    } else {
      const assistant = new LiveAssistant(
        (text, isNewTurn) => {
          setTranscriptionLogs(prev => {
            if (isNewTurn || prev.length === 0) return [...prev, text];
            const updated = [...prev];
            updated[updated.length - 1] += text;
            return updated;
          });
        },
        recipe.title,
        ingredientsList.map(i => i.name).join(', ')
      );
      await assistant.start(instructions[currentStep]);
      liveRef.current = assistant;
      setIsLiveActive(true);
    }
  };

  const handleCaptureFrame = () => {
    if (liveRef.current && canvasRef.current) {
      setTranscriptionLogs(prev => [...prev, "(Nary is looking through the camera...)"]);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row overflow-hidden font-sans text-slate-900">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:flex w-full h-full flex-row">
        {/* Left Sidebar */}
        <div className="w-[30%] bg-slate-900 text-white p-10 flex flex-col h-full overflow-y-auto">
          <button onClick={onExit} className="mb-10 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-white flex items-center gap-3 transition-colors">
            <i className="fa-solid fa-arrow-left"></i> {t.exit}
          </button>
          
          <img src={recipe.imageUrl} className="w-full aspect-video object-cover rounded-[2rem] mb-8 shadow-2xl border border-white/10" alt={recipe.title} />
          <h1 className="text-3xl font-black mb-6 leading-tight">{recipe.title}</h1>
          
          <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 shadow-inner mb-6">
            <header className="flex items-center justify-between mb-6">
              <h3 className="font-black text-emerald-400 uppercase text-[10px] tracking-widest">{t.ingredientsTitle}</h3>
              <div className="flex bg-white/10 p-1 rounded-xl">
                <button onClick={() => setLang('ID')} className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${lang === 'ID' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/40'}`}>ID</button>
                <button onClick={() => setLang('EN')} className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${lang === 'EN' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/40'}`}>EN</button>
              </div>
            </header>
            <ul className="space-y-4">
              {ingredientsList.map((ing, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm group">
                  <span className="text-white/70 font-medium">{ing.name} <span className="text-white/30 ml-1">({ing.quantity})</span></span>
                  <button onClick={() => onAddToShoppingList(ing.name)} className={`text-xl transition-all ${shoppingList.some(s => s.name === ing.name) ? 'text-emerald-400' : 'text-white/10 hover:text-white'}`}>
                    <i className={`fa-solid ${shoppingList.some(s => s.name === ing.name) ? 'fa-circle-check' : 'fa-circle-plus'}`}></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col p-16 bg-white overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">{t.instructions}</span>
              <span className="bg-emerald-50 text-emerald-700 px-5 py-1.5 rounded-full font-black text-xs border border-emerald-100 uppercase tracking-widest">
                {t.step} {currentStep + 1} {t.of} {instructions.length}
              </span>
            </div>

            {/* 1. Step Instructions at Top */}
            <div className="mb-10">
              <h2 className="text-5xl font-black text-slate-900 leading-[1.2]">{instructions[currentStep]}</h2>
            </div>

            {/* 2. Controls Row Below Instructions */}
            <div className="flex gap-6 mb-10">
              <button onClick={() => speakText(instructions[currentStep])} className="w-20 h-20 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center gap-1 text-slate-900 hover:bg-slate-100 shadow-sm transition-all border border-slate-100">
                <i className="fa-solid fa-volume-high text-xl"></i>
                <span className="text-[8px] font-black uppercase">Speak</span>
              </button>
              <button onClick={handleToggleLive} className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center gap-1 text-white transition-all shadow-xl ${isLiveActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'}`}>
                <i className={`fa-solid ${isLiveActive ? 'fa-microphone' : 'fa-microphone-slash'} text-xl`}></i>
                <span className="text-[8px] font-black uppercase">{isLiveActive ? 'On' : 'Mic'}</span>
              </button>
              <button onClick={handleCaptureFrame} className="w-20 h-20 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center gap-1 text-slate-900 hover:bg-slate-100 shadow-sm transition-all border border-slate-100">
                <i className="fa-solid fa-camera text-xl"></i>
                <span className="text-[8px] font-black uppercase">Look</span>
              </button>
            </div>

            {/* 3. Assistant Log at Bottom of Controls */}
            {isLiveActive && transcriptionLogs.length > 0 && (
              <div className="mb-10 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4 text-emerald-400 font-black uppercase text-xs tracking-widest">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {t.assistantLog}
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar pr-4">
                  {transcriptionLogs.map((log, i) => (
                    <p key={i} className="leading-relaxed text-sm opacity-90 mb-2 last:mb-0">
                      <span className="text-emerald-500 font-bold">Nary:</span> {log}
                    </p>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex gap-6 mt-auto">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} className="flex-1 py-6 bg-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">
                  {t.prev}
                </button>
              )}
              <button 
                onClick={() => currentStep < instructions.length - 1 ? setCurrentStep(prev => prev + 1) : onExit()} 
                className={`py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs shadow-2xl uppercase tracking-widest hover:bg-emerald-700 transition-colors ${currentStep > 0 ? 'flex-[2]' : 'w-full'}`}
              >
                {currentStep === instructions.length - 1 ? t.finish : t.next}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex flex-col h-full bg-slate-50">
        {/* Clean Header: Arrow + "< Ingredients" Label */}
        <div className="p-6 bg-white flex items-center border-b border-slate-100 shrink-0">
          <button 
            onClick={mobileSlide === 'execution' ? () => setMobileSlide('overview') : onExit} 
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl text-slate-800 active:scale-95 transition-transform font-black uppercase text-[10px] tracking-widest"
          >
             {mobileSlide === 'execution' ? (
                <>
                  <i className="fa-solid fa-arrow-left text-[12px]"></i>
                  <span>{t.backToIngredients}</span>
                </>
             ) : (
                <>
                  <i className="fa-solid fa-arrow-left text-[12px]"></i>
                  <span>{t.exit}</span>
                </>
             )}
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div className="flex h-full w-[200%] transition-transform duration-500 ease-out" style={{ transform: mobileSlide === 'overview' ? 'translateX(0%)' : 'translateX(-50%)' }}>
            
            {/* Slide 1: Ingredients Overview (Side by Side Grid) */}
            <div className="w-[50%] h-full overflow-y-auto p-6 space-y-6 flex flex-col">
              <img src={recipe.imageUrl} className="w-full aspect-video object-cover rounded-[2rem] shadow-xl" alt={recipe.title} />
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t.nowCooking}</span>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">{recipe.title}</h1>
              </div>

              <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100">
                <header className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{t.ingredientsTitle}</h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setLang('ID')} className={`px-3 py-1 text-[9px] font-black rounded-md ${lang === 'ID' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>ID</button>
                    <button onClick={() => setLang('EN')} className={`px-3 py-1 text-[9px] font-black rounded-md ${lang === 'EN' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>EN</button>
                  </div>
                </header>
                {/* Side-by-Side Ingredients Grid for Mobile Efficiency */}
                <ul className="grid grid-cols-2 gap-3">
                  {ingredientsList.map((ing, idx) => (
                    <li key={idx} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-start justify-between">
                        <span className="text-slate-900 font-bold text-[11px] leading-tight mb-1">{ing.name}</span>
                        <button onClick={() => onAddToShoppingList(ing.name)} className={`text-md ${shoppingList.some(s => s.name === ing.name) ? 'text-emerald-500' : 'text-slate-300'}`}>
                          <i className={`fa-solid ${shoppingList.some(s => s.name === ing.name) ? 'fa-circle-check' : 'fa-circle-plus'}`}></i>
                        </button>
                      </div>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">{ing.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setMobileSlide('execution')} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 active:scale-95 transition-transform">
                {t.start}
              </button>
            </div>

            {/* Slide 2: Step-by-Step Execution */}
            <div className="w-[50%] h-full flex flex-col p-6 bg-white overflow-y-auto">
              <div className="mb-6 shrink-0 flex justify-between items-center">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full font-black text-[10px] border border-emerald-100 uppercase tracking-widest">
                  {t.step} {currentStep + 1} / {instructions.length}
                </span>
              </div>

              {/* 1. Step Instructions at Top */}
              <div className="mb-10 min-h-[120px] flex items-center justify-center text-center px-4">
                 <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    {instructions[currentStep]}
                 </h2>
              </div>

              {/* 2. Controls Icons Row (Middle) */}
              <div className="flex justify-center gap-6 mb-10">
                <button onClick={() => speakText(instructions[currentStep])} className="w-16 h-16 bg-slate-50 text-slate-800 rounded-[1.5rem] flex flex-col items-center justify-center shadow-sm active:bg-slate-100">
                  <i className="fa-solid fa-volume-high text-lg"></i>
                  <span className="text-[7px] font-black uppercase mt-1">Read</span>
                </button>
                <button onClick={handleToggleLive} className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center text-white transition-all shadow-md active:scale-95 ${isLiveActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'}`}>
                  <i className={`fa-solid ${isLiveActive ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`}></i>
                  <span className="text-[7px] font-black uppercase mt-1">Mic</span>
                </button>
                <button onClick={handleCaptureFrame} className="w-16 h-16 bg-slate-50 text-slate-800 rounded-[1.5rem] flex flex-col items-center justify-center shadow-sm active:bg-slate-100">
                  <i className="fa-solid fa-camera text-lg"></i>
                  <span className="text-[7px] font-black uppercase mt-1">Look</span>
                </button>
              </div>

              {/* 3. Assistant Log (Bottom of controls) */}
              {isLiveActive && transcriptionLogs.length > 0 && (
                 <div className="mb-8 bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-3 text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       {t.assistantLog}
                    </div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2">
                       {transcriptionLogs.map((log, i) => (
                         <p key={i} className="text-[11px] leading-relaxed opacity-80 mb-2 last:mb-0">
                           <span className="text-emerald-500 font-bold">Nary:</span> {log}
                         </p>
                       ))}
                       <div ref={logEndRef} />
                    </div>
                 </div>
              )}

              {/* Navigation Bar (Sticky Bottom) */}
              <div className="mt-auto pt-4 space-y-4">
                <div className="flex gap-4">
                  {currentStep > 0 && (
                    <button 
                      onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] active:bg-slate-200"
                    >
                      {t.prev}
                    </button>
                  )}
                  <button 
                    onClick={() => currentStep < instructions.length - 1 ? setCurrentStep(prev => prev + 1) : onExit()}
                    className={`py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:bg-emerald-700 ${currentStep > 0 ? 'flex-[2]' : 'w-full'}`}
                  >
                    {currentStep === instructions.length - 1 ? t.finish : t.next}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
