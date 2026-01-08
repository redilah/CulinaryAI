
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, ShoppingItem } from './types';
import { speakText } from './geminiService';
import { LiveAssistant } from './liveAssistantService';

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
  const logEndRef = useRef<HTMLDivElement>(null);

  const instructions = lang === 'ID' ? recipe.instructionsID : recipe.instructionsEN;
  const ingredientsList = lang === 'ID' ? (recipe.ingredientsID || []) : (recipe.ingredientsEN || []);

  const t = {
    exit: lang === 'ID' ? 'Keluar' : 'Exit',
    backToIngredients: lang === 'ID' ? '< Bahan' : '< Ingredients',
    ingredientsTitle: lang === 'ID' ? 'Bahan & Takaran' : 'Ingredients',
    instructions: lang === 'ID' ? 'Langkah Memasak' : 'Instructions',
    step: lang === 'ID' ? 'Langkah' : 'Step',
    of: lang === 'ID' ? 'dari' : 'of',
    prev: lang === 'ID' ? 'Kembali' : 'Previous',
    next: lang === 'ID' ? 'Lanjut >' : 'Next >',
    finish: lang === 'ID' ? 'Selesai' : 'Finish',
    start: lang === 'ID' ? 'Mulai Masak Sekarang' : 'Start Cooking',
    nowCooking: lang === 'ID' ? 'Mode Memasak' : 'Now Cooking',
    assistantLog: lang === 'ID' ? 'Nary AI Assistant' : 'Nary AI Assistant'
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
        ingredientsList.map(i => `${i.name} (${i.quantity})`).join(', ')
      );
      await assistant.start(instructions[currentStep]);
      liveRef.current = assistant;
      setIsLiveActive(true);
    }
  };

  const progress = ((currentStep + 1) / instructions.length) * 100;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row overflow-hidden font-sans text-slate-900">
      
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:flex w-full h-full flex-row">
        <div className="w-[30%] bg-slate-900 text-white p-10 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <button onClick={onExit} className="mb-10 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:text-white transition-colors">
            <i className="fa-solid fa-arrow-left"></i> {t.exit}
          </button>
          <img src={recipe.imageUrl} className="w-full aspect-square object-cover rounded-[2.5rem] mb-8 shadow-2xl border border-white/5" alt={recipe.title} />
          <h1 className="text-3xl font-black mb-6 leading-tight tracking-tighter">{recipe.title}</h1>
          <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
            <header className="flex items-center justify-between mb-8">
              <h3 className="font-black text-emerald-400 uppercase text-[10px] tracking-widest">{t.ingredientsTitle}</h3>
              <div className="flex bg-white/10 p-1 rounded-xl">
                <button onClick={() => setLang('ID')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${lang === 'ID' ? 'bg-white text-slate-900' : 'text-white/40'}`}>ID</button>
                <button onClick={() => setLang('EN')} className={`px-3 py-1 text-[9px] font-black rounded-lg ${lang === 'EN' ? 'bg-white text-slate-900' : 'text-white/40'}`}>EN</button>
              </div>
            </header>
            <ul className="space-y-5">
              {ingredientsList.map((ing, idx) => (
                <li key={idx} className="flex items-start justify-between text-sm group">
                  <div className="flex flex-col">
                    <span className="text-white font-bold leading-tight">{ing.name}</span>
                    <span className="text-white/40 text-[11px] font-bold mt-1">{ing.quantity}</span>
                  </div>
                  <button onClick={() => onAddToShoppingList(ing.name)} className={`text-xl transition-colors ${shoppingList.some(s => s.name === ing.name) ? 'text-emerald-400' : 'text-white/10 hover:text-white'}`}>
                    <i className={`fa-solid ${shoppingList.some(s => s.name === ing.name) ? 'fa-circle-check' : 'fa-circle-plus'}`}></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-12 lg:p-20 bg-white overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t.instructions}</span>
                 <div className="flex gap-4">
                  <button onClick={() => speakText(instructions[currentStep])} className="w-12 h-12 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-100 transition-all">
                    <i className="fa-solid fa-volume-high"></i>
                  </button>
                  <button onClick={handleToggleLive} className={`w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all shadow-lg ${isLiveActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'}`}>
                    <i className={`fa-solid ${isLiveActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                  </button>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">
                {t.step} {currentStep + 1} / {instructions.length}
              </span>
            </div>

            <div className="flex-1 flex items-center py-12">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.3] tracking-tight">
                {instructions[currentStep]}
              </h2>
            </div>

            {isLiveActive && transcriptionLogs.length > 0 && (
              <div className="mt-8 mb-8 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="flex items-center gap-3 mb-6 text-emerald-400 font-black uppercase text-[10px] tracking-widest">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {t.assistantLog}
                </div>
                <div className="max-h-32 overflow-y-auto custom-scrollbar pr-6 text-base font-medium opacity-90 italic">
                  {transcriptionLogs.map((log, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      <span className="text-emerald-500 not-italic font-black mr-2">Nary:</span> {log}
                    </p>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            )}

            <div className="flex gap-6 mt-12 pb-8">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} className="flex-1 py-7 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">
                  {t.prev}
                </button>
              )}
              <button 
                onClick={() => currentStep < instructions.length - 1 ? setCurrentStep(prev => prev + 1) : onExit()} 
                className={`py-7 bg-emerald-600 text-white rounded-[2rem] font-black text-xs shadow-2xl shadow-emerald-200 uppercase tracking-widest transition-all active:scale-95 ${currentStep > 0 ? 'flex-[2.5]' : 'w-full'}`}
              >
                {currentStep === instructions.length - 1 ? t.finish : t.next}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex flex-col h-full bg-white">
        <div className="p-6 bg-white flex items-center justify-between border-b border-slate-100 shrink-0">
          <button 
            onClick={mobileSlide === 'execution' ? () => setMobileSlide('overview') : onExit} 
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl text-slate-800 font-black uppercase text-[10px] tracking-widest"
          >
             <i className="fa-solid fa-arrow-left"></i>
             <span>{mobileSlide === 'execution' ? t.backToIngredients : t.exit}</span>
          </button>
          {mobileSlide === 'execution' && (
            <div className="flex gap-2">
              <button onClick={() => speakText(instructions[currentStep])} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600"><i className="fa-solid fa-volume-high text-sm"></i></button>
              <button onClick={handleToggleLive} className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isLiveActive ? 'bg-rose-500' : 'bg-slate-900'}`}><i className={`fa-solid ${isLiveActive ? 'fa-microphone' : 'fa-microphone-slash'} text-sm`}></i></button>
            </div>
          )}
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div className="flex h-full w-[200%] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)" style={{ transform: mobileSlide === 'overview' ? 'translateX(0%)' : 'translateX(-50%)' }}>
            
            {/* Slide 1: Overview */}
            <div className="w-[50%] h-full overflow-y-auto p-6 space-y-8 flex flex-col bg-slate-50">
              <img src={recipe.imageUrl} className="w-full aspect-square object-cover rounded-[2.5rem] shadow-xl border border-white" alt={recipe.title} />
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">{t.nowCooking}</span>
                <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">{recipe.title}</h1>
                <p className="text-slate-500 text-sm font-medium italic">"{recipe.description}"</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <header className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{t.ingredientsTitle}</h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setLang('ID')} className={`px-3 py-1 text-[9px] font-black rounded-md ${lang === 'ID' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>ID</button>
                    <button onClick={() => setLang('EN')} className={`px-3 py-1 text-[9px] font-black rounded-md ${lang === 'EN' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>EN</button>
                  </div>
                </header>
                <ul className="space-y-5">
                  {ingredientsList.map((ing, idx) => (
                    <li key={idx} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold text-sm leading-tight">{ing.name}</span>
                        <span className="text-slate-400 font-bold text-[10px] mt-0.5">{ing.quantity}</span>
                      </div>
                      <button onClick={() => onAddToShoppingList(ing.name)} className={`text-xl ${shoppingList.some(s => s.name === ing.name) ? 'text-emerald-500' : 'text-slate-200'}`}>
                        <i className={`fa-solid ${shoppingList.some(s => s.name === ing.name) ? 'fa-circle-check' : 'fa-circle-plus'}`}></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setMobileSlide('execution')} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 transition-all active:scale-95">
                {t.start}
              </button>
            </div>

            {/* Slide 2: Steps */}
            <div className="w-[50%] h-full flex flex-col p-6 bg-white overflow-hidden">
              <div className="mb-6">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                   <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full font-black text-[10px] border border-emerald-100 uppercase tracking-widest">
                  {t.step} {currentStep + 1} / {instructions.length}
                </span>
              </div>

              <div className="flex-1 flex items-center overflow-y-auto px-2">
                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-[1.4] tracking-tight">
                    {instructions[currentStep]}
                 </h2>
              </div>

              {isLiveActive && transcriptionLogs.length > 0 && (
                 <div className="mb-6 bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-3 text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       {t.assistantLog}
                    </div>
                    <div className="max-h-24 overflow-y-auto custom-scrollbar pr-2 text-xs opacity-90 italic">
                       {transcriptionLogs.map((log, i) => (
                         <p key={i} className="mb-2 last:mb-0">
                           <span className="text-emerald-500 font-black mr-2">Nary:</span> {log}
                         </p>
                       ))}
                       <div ref={logEndRef} />
                    </div>
                 </div>
              )}

              <div className="mt-auto pt-6 flex gap-4">
                {currentStep > 0 && (
                  <button 
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    {t.prev}
                  </button>
                )}
                <button 
                  onClick={() => currentStep < instructions.length - 1 ? setCurrentStep(prev => prev + 1) : onExit()}
                  className={`py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 ${currentStep > 0 ? 'flex-[2]' : 'w-full'}`}
                >
                  {currentStep === instructions.length - 1 ? t.finish : t.next}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
